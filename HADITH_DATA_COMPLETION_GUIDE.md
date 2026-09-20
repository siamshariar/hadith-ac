# Hadith Database — Full Data Completion Guide

**Handoff document for completing the hadith database.**
Audience: whoever picks up this task next (developer/data engineer). This document assumes no prior context — read top to bottom before running anything.

---

## 1. What this project is

A Laravel API (`laravel_api/`) backed by a MySQL/MariaDB database (`hadith_db`) that serves:
- Hadith collections (books) — e.g. Sahih al-Bukhari, Sahih Muslim
- Chapters within each book
- A topical category / sub-category tree (e.g. "Jurisprudence → Acts of Worship → Purification → Wudoo'")
- Hadith text in Arabic + translations in multiple languages

The app is already running and serving correct data for books/chapters/hadiths. **What's missing is: (a) a correct multi-level category tree, (b) hadiths linked to their categories, (c) full-language translation coverage.** This document is the complete plan to finish all three, safely, without breaking what already works.

---

## 2. The non-negotiable rule: book isolation

**Every hadith must belong to exactly one book, and that book's hadiths must never appear mixed into another book's list.**

This is already enforced structurally and must stay enforced:

```
hadiths.book_id     → must always equal →  chapters.book_id
                                            (via hadiths.chapter_id → chapters.id)
```

Verify this is true before and after every import:

```sql
-- Must always return 0. If it ever returns >0, STOP — an import script
-- has a bug that mixed hadiths from one book into another book's chapter.
SELECT COUNT(*) AS mismatches
FROM hadiths h
JOIN chapters c ON h.chapter_id = c.id
WHERE h.book_id != c.book_id;
```

**Rule for anyone writing a new import script:** always resolve `chapter_id` from the API's own book+chapter identifiers, never guess or reuse a chapter_id from a different book. When inserting a new chapter, always insert it tied to the correct `book_id` first, then use that new chapter's own `id` for hadiths — never hardcode chapter IDs across books.

This is also why `books/{id}/hadiths` and `books/{id}/chapters` in the Laravel API filter strictly by `book_id` / `chapter_id` — that's correct and must not change.

---

## 3. Current state (as of this audit)

| Table | Rows | Status |
|---|---|---|
| `books` | 10 | ✅ complete |
| `chapters` | 407 | ✅ complete, correctly isolated per book |
| `hadiths` | 36,104 | ✅ complete (Arabic text) |
| `hadith_translations` | 223,217 | ⚠️ uneven — see §3.1 |
| `categories` | 452 | ❌ **structurally broken** — see §3.2 |
| `hadith_category` (pivot) | 0 | ❌ **empty** — no hadith is linked to any category |

### 3.1 Translation coverage by language (out of 36,104 hadiths)

| Code | Language | Rows | Coverage |
|---|---|---|---|
| en | English | 36,093 | 100% |
| bn | Bengali | 35,755 | 99% |
| ur | Urdu | 33,211 | 92% |
| fr | French | 31,702 | 88% |
| id | Indonesian | 30,778 | 85% |
| tr | Turkish | 30,267 | 84% |
| ru | Russian | 14,764 | 41% |
| ta | Tamil | 9,912 | 27% |
| vi | Vietnamese | 735 | 2% |

### 3.2 The category tree bug (found and confirmed during this audit)

The real taxonomy (sourced from HadeethEnc, see §5) is a **5-level hierarchy**:

| Depth | Count |
|---|---|
| 0 (root) | 7 |
| 1 | 39 |
| 2 | 232 |
| 3 | 136 |
| 4 (deepest) | 38 |
| **Total** | **452** |

But the current `categories` table has only **1 fake root** with all 451 other categories flattened as its direct children — including the other 6 real root categories.

**Root cause (confirmed by testing the API directly):** the old import script (`Scripts/hadeethenc_complete_importer.py`) called:
```
GET /categories/list/?language=en&category_id={X}
```
expecting it to return only the children of category `{X}`. It does not — **this endpoint ignores the `category_id` parameter and always returns all 452 categories flat**, regardless of what ID you pass. So when the script processed the first root category, it received back all 452 categories and inserted every single one as that root's child.

**The fix does not need that broken endpoint at all.** A single different call returns everything correctly in one shot — see §6, Step 1.

---

## 4. Database schema — full table/column plan

This section is the reference for every table involved. Column types shown are the **live, current** types in `hadith_db` (already created — do not re-create these tables, only add the small number of new columns marked **[NEW]**).

### 4.1 `books`

| Column | Type | Notes |
|---|---|---|
| id | int, PK, auto_increment | |
| code | varchar(50), unique | e.g. `bukhari`, `muslim` — stable machine key |
| name_en | varchar(255) | |
| name_ar | varchar(255), nullable | |
| total_hadith | int, default 0 | cached count, kept in sync with actual hadith rows |
| slug | varchar(512) | URL-friendly |
| created_at / updated_at / deleted_at | timestamp | soft deletes supported |

### 4.2 `books_localizations` (book name per language)

| Column | Type | Notes |
|---|---|---|
| id | int, PK | |
| book_id | int, FK → books.id | |
| localization_id | int | FK → localization.id |
| localization_code | varchar(10) | e.g. `en`, `vi`, `bn` — denormalized for fast lookups |
| name | varchar(255) | translated book name |
| slug | varchar(512) | |
| created_at / updated_at / deleted_at | timestamp | |

Unique constraint: `(book_id, localization_code)` — one translated name per book per language.

### 4.3 `chapters`

| Column | Type | Notes |
|---|---|---|
| id | int, PK | |
| book_id | int, FK → books.id | **must always be the chapter's real parent book** |
| chapter_no | int | order within the book |
| name_en | varchar(255) | |
| name_ar | varchar(255), nullable | |
| total_hadith | int, default 0 | cached count |
| slug | varchar(512) | |
| created_at / updated_at / deleted_at | timestamp | |

Index: `(book_id, chapter_no)` — this is what guarantees a chapter can be found only within its own book context.

### 4.4 `chapters_localizations` (chapter name per language)

Same shape as `books_localizations`, keyed by `chapter_id` instead of `book_id`. Unique constraint: `(chapter_id, localization_code)`.

### 4.5 `hadiths`

| Column | Type | Notes |
|---|---|---|
| id | bigint, PK | |
| book_id | int, FK → books.id | **must equal the chapter's book_id — see §2** |
| chapter_id | int, FK → chapters.id | |
| hadith_number | varchar(50) | book-scoped hadith number, e.g. "1", "1a" |
| arabic_text | longtext | source text, required |
| grade | varchar(100), nullable | e.g. "Sahih", "Hasan" |
| **hadeethenc_id** | **varchar(20), nullable, unique** | **[NEW]** — see §6 Step 2. Lets re-running the linking script skip hadiths already matched, so it never creates duplicates. |
| created_at / updated_at / deleted_at | timestamp | |

Indexes already in place: `book_id`, `chapter_id`, `hadith_number`, `(book_id, chapter_id)`, `(book_id, hadith_number)`, `deleted_at`.

**Add the new column like this:**
```sql
ALTER TABLE hadiths
  ADD COLUMN hadeethenc_id VARCHAR(20) NULL AFTER grade,
  ADD UNIQUE INDEX idx_hadeethenc_id (hadeethenc_id);
```

### 4.6 `hadith_translations`

| Column | Type | Notes |
|---|---|---|
| id | bigint, PK | |
| hadith_id | bigint, FK → hadiths.id | |
| localization_id | int | FK → localization.id |
| localization_code | varchar(10) | e.g. `en`, `vi`, `ur` |
| translation_text | longtext | |
| translation_quality | enum('verified','auto','community'), default 'verified' | mark machine-assisted text as `auto`, never mix silently with verified text |
| translator_name | longtext, nullable | |
| created_at / updated_at / deleted_at | timestamp | |

Recommended unique constraint (if not already present, add it): `(hadith_id, localization_code)` — one translation per hadith per language; re-running an import should update, not duplicate.

### 4.7 `categories` (the tree — being rebuilt, see §6 Step 1)

| Column | Type | Notes |
|---|---|---|
| id | int, PK | |
| parent_id | int, nullable, FK → categories.id (self-referencing) | `NULL` = root category |
| name_en | varchar(255) | |
| name_ar | varchar(255), nullable | |
| slug | varchar(512) | |
| **hadeethenc_category_id** | **varchar(20), nullable, unique** | **[NEW]** — lets the linking script (§6 Step 2) map back to the source category cleanly |
| **source_hadeeths_count** | **int, nullable** | **[NEW]** — the `hadeeths_count` value HadeethEnc reported for this category at import time. Stored so §7.3 query C has something real to reconcile against instead of comparing to nothing. This is a snapshot, not a live count — expect it to drift slightly from the live API over time; that's fine, it exists purely to sanity-check the linking step at the time it ran. |
| created_at / updated_at / deleted_at | timestamp | |

```sql
ALTER TABLE categories
  ADD COLUMN hadeethenc_category_id VARCHAR(20) NULL AFTER slug,
  ADD COLUMN source_hadeeths_count INT NULL AFTER hadeethenc_category_id,
  ADD UNIQUE INDEX idx_hadeethenc_category_id (hadeethenc_category_id);
```

When inserting each category in §8 Step 1, also store the `hadeeths_count` field from that same API response into `source_hadeeths_count` — no extra API call needed, it's already in the payload you're inserting from.

**Depth is derived, not stored** — walk `parent_id` upward to compute a category's depth/breadcrumb on read, or compute it once into a cached `depth` column if the API needs to filter by depth often (optional, not required for correctness).

### 4.8 `category_localizations`

Same pattern as book/chapter localizations, keyed by `category_id`. Unique constraint: `(category_id, localization_code)`.

### 4.9 `hadith_category` (the pivot table — currently empty, see §6 Step 3)

| Column | Type | Notes |
|---|---|---|
| hadith_id | bigint, FK → hadiths.id | |
| category_id | int, FK → categories.id | |

Composite primary key: `(hadith_id, category_id)`. **This is deliberately many-to-many** — one hadith can and often does belong to multiple categories (e.g. a hadith about charity during Ramadan belongs to both "Zakat" and "Fasting"). Never model this as a single `category_id` column on `hadiths` itself.

### 4.10 `localization` (master list of supported languages)

| Column | Type | Notes |
|---|---|---|
| id | int, PK | |
| code | varchar(10), unique | e.g. `vi`, `bn`, `ur` |
| name | varchar(100) | English name of the language, e.g. "Vietnamese" |
| native_name | varchar(100) | e.g. "Tiếng Việt" |
| country | varchar(100) | primary country associated with this language |
| country_code | varchar(10) | ISO code, e.g. "VN" |
| region | varchar(50) | e.g. "Southeast Asia" |
| rtl | tinyint(1) | 1 if right-to-left script |
| population, language_family, script_type | supporting metadata | |

**"All country" coverage = adding a row here for every country/language you want, then making sure `hadith_translations` has that `localization_code` for every hadith.** There is no separate "country" table for hadiths — country is reached through language.

### 4.11 `chapter_mappings` (optional, currently unused — leave empty unless you have cross-book chapter equivalence data to add later)

---

## 5. Sources to use

| Source | What it gives | Used for |
|---|---|---|
| **Fawaz Hadith API** (GitHub, already integrated) | Arabic text + ~9 languages, 10 books | Already imported — the base of everything |
| **HadeethEnc API** — `https://hadeethenc.com/api/v1` | The real 452-category, 5-level tree; category↔hadith membership (9,888 links); text in up to 72 languages per hadith, including Vietnamese with real attribution | Fixes the category tree, the hadith-category links, and most of the translation gap |
| **Sunnah.com API** (free API key required — sign up before use) | Alternate editions / extra language sets for the same books | Optional supplement for hadiths HadeethEnc doesn't cover |
| Manual/verified translation | For any hadith left with no source translation | Last resort only — never silently machine-translate a religious text corpus and mark it as verified |

**Do not use / do not run these — confirmed broken or superseded during this audit:**
- `laravel_api/scripts/comprehensive_relation_import.py` and similar files in `laravel_api/scripts/` — target an old schema that no longer matches the live database.
- `ARCHIVE/root_scripts/CATEGORY_WISE_COMPLETE_IMPORTER.py` and `ARCHIVE/root_scripts/REAL_TRANSLATION_IMPORTER.py` — old schema, and the translation importer references placeholder API URLs (e.g. `bengali-hadith-api.com`) that are not real functioning services.

---

## 6. Clean re-import: remove stale data, import fresh from current sources only

**Why this section exists:** the `Scripts/` and `laravel_api/scripts/` directories have accumulated ~50+ import scripts from different attempts over several months (Oct 2025 → Feb 2026), several targeting schemas that no longer exist, using book/category/hadith identifiers that don't line up with each other. Mixing outputs from old and new scripts is exactly how mismatches happen — e.g. two different scripts each inventing their own `category_id` numbering for the same category name, or one script's `book_id=3` meaning Abu Dawud while another's `book_id=3` means Tirmidhi. **The safe fix is not to patch old data — it's to wipe the affected tables and re-import everything from only the current, confirmed-good sources, in one continuous run.**

### 6.1 Freeze the source list first

Before wiping anything, write down (in a comment at the top of your new import script) the **exact** sources and endpoints this fresh import will use — this becomes the single source of truth so nobody accidentally mixes in an old script's output later:

```
BOOKS + CHAPTERS + ARABIC TEXT + BASE TRANSLATIONS  →  Fawaz Hadith API
  https://raw.githubusercontent.com/fawazahmed0/hadith-api/1/editions/{edition}/{n}.json
  (already the source of the current 10 books / 36,104 hadiths — keep this)

CATEGORY TREE + CATEGORY-HADITH LINKS + EXTRA LANGUAGES  →  HadeethEnc API
  https://hadeethenc.com/api/v1/...
  (replaces the old, broken hadeethenc_complete_importer.py logic — see §3.2)

SUPPLEMENTAL TRANSLATIONS (only if Fawaz+HadeethEnc leave gaps)  →  Sunnah.com API
  (requires a free API key — sign up before use)
```

Any script or CSV not listed here (this includes everything under `laravel_api/scripts/`, `ARCHIVE/root_scripts/`, and old CSVs in `Scripts/csv_exports/`) is **out of scope for this re-import** and must not be run or merged in.

### 6.2 Back up before wiping — always

```bash
mysqldump -u root -p123456 hadith_db > hadith_db_backup_$(date +%Y%m%d_%H%M%S).sql
```
Never skip this. If the fresh import goes wrong halfway through, this is the only way back to the current working 36,104-hadith dataset without re-running everything from scratch.

### 6.3 Decide the wipe scope

Two options depending on how much you trust the current base data:

**Option A — Rebuild only categories + links (recommended, minimal risk).**
The current `books`/`chapters`/`hadiths`/`hadith_translations` data already passed the consistency checks in §3 (counts match, no book-isolation violations, en/bn/ur coverage is high). Only the category tree and pivot table are actually broken. Wipe just those:
```sql
TRUNCATE TABLE hadith_category;
TRUNCATE TABLE category_localizations;
TRUNCATE TABLE categories;
```
Then run Steps 1–2 from §8 (previously the "Step 1/Step 2" of the import process) against this clean slate. This is what §8 below assumes by default.

**Option B — Full wipe and full fresh re-import of everything (only if you suspect the base hadith/translation data itself has hidden mismatches, not just the category tree).**
```sql
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE hadith_category;
TRUNCATE TABLE hadith_translations;
TRUNCATE TABLE hadiths;
TRUNCATE TABLE chapters_localizations;
TRUNCATE TABLE chapters;
TRUNCATE TABLE books_localizations;
TRUNCATE TABLE books;
TRUNCATE TABLE category_localizations;
TRUNCATE TABLE categories;
TRUNCATE TABLE chapter_mappings;
SET FOREIGN_KEY_CHECKS = 1;
```
Then re-run the full pipeline **in this exact order** (this is the same order the existing working `Scripts/master_hadith_orchestrator.py` already uses for the first two — reuse it, then continue with the new steps in §8):
```
1. Fawaz Hadith API import   → books, chapters, hadiths, base translations
2. HadeethEnc category import → categories (using the CORRECTED single-call
                                 method in §8 Step 1, not the old broken script)
3. HadeethEnc linking import  → hadith_category (§8 Step 2)
4. Translation backfill       → hadith_translations (§8 Step 3)
```
Only choose Option B if you have a specific reason to distrust the base data — it takes hours (re-fetching all 36,104 hadiths × ~9 languages) versus minutes for Option A.

### 6.4 Delete the superseded scripts (don't just ignore them)

Leaving broken scripts sitting in the repo is how the next person accidentally runs the wrong one again. **Only do this after the full §9 acceptance checklist passes — not after Steps 1-2 of §8 look good, and not merely because Step 3 (translation backfill) has started.** Step 3 can run for hours per language; archiving scripts while it's still in progress, or before the final checklist confirms coverage, risks losing the ability to re-run a step if something needs fixing mid-way. Wait for a completed, verified run of all of §8:

```bash
# Move rather than hard-delete, so this is reversible if something was missed
mkdir -p ARCHIVE/superseded_$(date +%Y%m%d)
git mv laravel_api/scripts ARCHIVE/superseded_$(date +%Y%m%d)/laravel_api_scripts 2>/dev/null || mv laravel_api/scripts ARCHIVE/superseded_$(date +%Y%m%d)/laravel_api_scripts
```
Keep only the confirmed-current set under `Scripts/`:
- `Scripts/fawaz_fixed_importer.py`
- `Scripts/config.py`, `Scripts/database.py`, `Scripts/utils.py` (shared helpers)
- The new scripts you write in §8: `rebuild_category_tree.py`, `link_hadith_categories.py`, `backfill_translations.py`
- Delete or archive every other importer variant in `Scripts/` (the `comprehensive_*`, `ultimate_*`, `final_*`, `production_*` files) — these were earlier attempts superseded by `fawaz_fixed_importer.py` and are a mismatch risk if anyone runs them again by mistake.

---

## 7. Cross-source verification — making sure data matches across sources

**The goal:** when the same hadith exists in more than one source (Fawaz and HadeethEnc both have Sahih al-Bukhari, for example), the text, numbering, and grading in your database must represent one correct, consistent version — not silently take whichever source happened to run last.

### 7.1 Where mismatches can happen

| Mismatch type | Example | Why it matters |
|---|---|---|
| **Different hadith numbering schemes** | Fawaz numbers a Bukhari hadith "1"; another source might number the same narration differently within its own chapter split | If you link by number instead of by matched text, you can attach the wrong category to the wrong hadith |
| **Text variants** | Minor wording differences between two digitizations of the same Arabic hadith | Matching by exact string equality will under-match; matching too loosely (e.g. by narrator name alone) will over-match and merge two different hadiths |
| **Grade disagreement** | One source says "Sahih", another says "Sahih li ghairihi" or omits grade | Don't silently overwrite an existing grade — keep the original source's grade, add the new source's grade as a separate note/field if needed, never blend them into one guessed value |
| **Translation drift** | Fawaz's English translation of a hadith and HadeethEnc's English translation of "the same" hadith read differently | These are not necessarily a bug — different sources may use different translators. Do not force them to match; instead correctly link both under the same `hadith_id` for the correct language rows respectively, and keep `translator_name` populated so it's clear which is which |

### 7.2 The matching rule to use when linking HadeethEnc data to existing Fawaz hadiths (§8 Step 2)

Use this priority order — do not skip to a weaker match just because it's faster:

1. **Exact Arabic text match** (after normalizing: strip diacritics/tashkeel, normalize whitespace, normalize Arabic letter variants like أ/إ/آ → ا) — this is the strongest signal and should be tried first.
2. **If no exact match**, try matching on `(book_code, hadith_number)` where both sources reference the same known book (e.g. both say "Sahih al-Bukhari, Hadith 1") — only do this for books that exist in both sources.
3. **If neither matches**, treat it as a genuinely new hadith from HadeethEnc (not present in the Fawaz import) — insert it as new, tagged with `hadeethenc_id`, and never force-attach it to an existing unrelated hadith just to avoid creating a new row.

Log every match decision (which rule fired, confidence) to a file, e.g. `Scripts/logs/hadith_matching_log.csv`, so mismatches can be spot-checked and corrected later without re-running the whole import.

### 7.3 Verification queries to run after every import (catch mismatches before they reach the API)

```sql
-- A. Duplicate Arabic text under different hadith IDs within the SAME book
--    (a sign the matching step failed to recognize the same hadith twice)
SELECT arabic_text, book_id, COUNT(*) c, GROUP_CONCAT(id) ids
FROM hadiths
GROUP BY arabic_text, book_id
HAVING c > 1
LIMIT 50;

-- B. A hadith with translations in a language but no Arabic source text
--    (should never happen — Arabic is NOT NULL, but check for empty strings)
SELECT id FROM hadiths WHERE TRIM(arabic_text) = '';

-- C. A category whose actual linked-hadith count drifts a lot from the
--    hadeeths_count HadeethEnc reported at import time (stored in
--    categories.source_hadeeths_count, see §4.7). Small drift is expected
--    (matching against existing hadiths can merge some, and a hadith can
--    also legitimately belong to more than one category) — flag anything
--    where linked_count is 0 while source_hadeeths_count > 0, or where the
--    gap is larger than a small tolerance, e.g. >20%:
SELECT c.id, c.name_en, c.source_hadeeths_count,
       COUNT(hc.hadith_id) AS linked_count,
       ROUND(ABS(COUNT(hc.hadith_id) - c.source_hadeeths_count) /
             NULLIF(c.source_hadeeths_count, 0) * 100, 1) AS pct_drift
FROM categories c
LEFT JOIN hadith_category hc ON hc.category_id = c.id
GROUP BY c.id
HAVING (c.source_hadeeths_count > 0 AND linked_count = 0)
    OR pct_drift > 20
ORDER BY pct_drift DESC;

-- D. Same book-isolation check as §2, must still be 0 after every import
SELECT COUNT(*) FROM hadiths h JOIN chapters c ON h.chapter_id = c.id
WHERE h.book_id != c.book_id;

-- E. Translations that look like unresolved placeholders from an old broken
--    script (e.g. leftover "[Category: X]" text — see §5's do-not-use list)
SELECT id, hadith_id, localization_code, LEFT(translation_text, 60)
FROM hadith_translations
WHERE translation_text LIKE '[%]%' OR translation_text LIKE '%Translation needed%'
LIMIT 50;
```

If query E returns any rows, that's old broken-script output that made it into the database — delete those specific rows and re-import that hadith's translation from the correct current source (§5) rather than leaving it.

---

## 8. Step-by-step import process

Run these in order. Each step depends on the previous one's output. Verify with the SQL query at the end of each step before moving to the next.

### Step 0 — Environment setup

```bash
cd /data_E/hadith_api_prod/Scripts
source ../.venv/bin/activate
python3 -c "from database import Database; d=Database(); c=d.get_connection(); print('OK', c.is_connected())"
```
Must print `OK True`. If not, fix the DB connection in `Scripts/config.py` before continuing.

### Step 1 — Rebuild the category tree (fixes §3.2)

**Goal:** replace the broken 1-root/451-flat-children tree with the correct 7-root, 5-level, 452-category tree.

1. Make one API call (this single endpoint returns everything correctly, unlike the old broken per-category endpoint):
   ```
   GET https://hadeethenc.com/api/v1/categories/list/?language=en
   ```
   This returns all 452 categories as a flat JSON array, each row already containing `{id, title, hadeeths_count, parent_id}` — the correct parent-child relationship is already in this response, no crawling needed.

   **Verified during this audit, don't just trust the claim — re-check it yourself before relying on it:**
   ```bash
   curl -s "https://hadeethenc.com/api/v1/categories/list/?language=en" | python3 -c "
   import json,sys
   d = json.load(sys.stdin)
   print('total rows:', len(d))                                    # expect 452
   print('distinct parent_id values (roots = null):',
         len(set(c['parent_id'] for c in d)))
   roots = [c for c in d if c['parent_id'] is None]
   print('root count:', len(roots))                                 # expect 7
   for r in roots: print(' -', r['id'], r['title'])
   "
   ```
   At the time of this audit this printed `total rows: 452`, `root count: 7`, listing "The Noble Qur'an and Qur'anic Sciences," "The Hadith and Hadith Sciences," "The Creed," "Jurisprudence and Juristic Principles," "Virtues and Manners," "Da'wah and Hisbah," "Seerah and History." If a re-run of this check ever returns a different root count, HadeethEnc's API shape has changed since this guide was written — stop and re-verify the rest of §8 Step 1 against the new response shape before proceeding.

2. Sort the 452 rows so every parent is inserted before its children (a topological sort: start with rows where `parent_id` is `null`, then repeatedly insert any row whose `parent_id` has already been inserted, until all 452 are placed).

3. Before inserting, clear the old broken data (safe — currently holds 0 useful links):
   ```sql
   TRUNCATE TABLE hadith_category;
   TRUNCATE TABLE category_localizations;
   TRUNCATE TABLE categories;
   ```

4. Insert each row into `categories` in that parent-first order, filling `hadeethenc_category_id` with the source `id` so Step 2 can map back to it, and `parent_id` by looking up the local `id` you already assigned to that row's parent.

5. Repeat the same single call once per additional language you want category names in (`ar`, `bn`, `ur`, `fr`, `tr`, `id`, `ru`, `vi`, ...) and insert into `category_localizations`.

6. **Verify — must match exactly:**
   ```sql
   -- Root count
   SELECT COUNT(*) FROM categories WHERE parent_id IS NULL;   -- expect 7

   -- Total count
   SELECT COUNT(*) FROM categories;                            -- expect 452
   ```

### Step 2 — Link every hadith to its category / sub-category (fixes the empty pivot table)

**Goal:** populate `hadith_category` so `GET /categories/{id}/hadiths` and `GET /categories/{id}/sub-categories` both return real data, at every level of the tree.

1. Add the new column first (see §4.5):
   ```sql
   ALTER TABLE hadiths
     ADD COLUMN hadeethenc_id VARCHAR(20) NULL AFTER grade,
     ADD UNIQUE INDEX idx_hadeethenc_id (hadeethenc_id);
   ```

2. For each of the 452 categories (using the `hadeethenc_category_id` saved in Step 1), page through its hadiths:
   ```
   GET /hadeeths/list/?language=en&category_id={hadeethenc_category_id}&page=1&per_page=50
   ```
   Keep incrementing `page` until you reach `meta.last_page`. This endpoint correctly filters by category (only the *nested-category* endpoint from the old bug was broken — this flat list endpoint works as expected).

3. For each hadith ID returned, fetch its full record once:
   ```
   GET /hadeeths/one/?language=ar&id={hadith_id}
   ```
   This gives Arabic text, attribution, grade, and its full `categories[]` list (a hadith can appear in more than one category — capture all of them, not just the one you found it under).

4. Try to match this against an existing row in `hadiths` (36,104 already imported) by comparing Arabic text.
   - **Match found** → just create the link, do not insert a duplicate hadith.
   - **No match** → this is a HadeethEnc-only hadith not already in your database. Insert it as a new row in `hadiths`, correctly resolving its `book_id`/`chapter_id` per the book-isolation rule in §2, and set its `hadeethenc_id`.

5. For every (hadith, category) pair found:
   ```sql
   INSERT IGNORE INTO hadith_category (hadith_id, category_id) VALUES (?, ?);
   ```

6. Rate-limit with a short sleep (0.1–0.2s) between API calls, same pattern as the existing working importer (`Scripts/fawaz_fixed_importer.py`). Expect roughly 20–40 minutes total for all 452 categories (~9,888 category-hadith memberships). This step is safe to stop with Ctrl+C and resume later — since Step 2.4 skips hadiths that already have a `hadeethenc_id`, and `INSERT IGNORE` never duplicates a pivot row.

7. **Verify:**
   ```sql
   SELECT COUNT(*) FROM hadith_category;   -- expect ~9,888 or more

   -- See coverage by top-level (root) category
   SELECT root.name_en, COUNT(DISTINCT hc.hadith_id) AS linked_hadiths
   FROM categories root
   JOIN categories c ON c.parent_id = root.id OR c.id = root.id
   LEFT JOIN hadith_category hc ON hc.category_id = c.id
   WHERE root.parent_id IS NULL
   GROUP BY root.id;

   -- Confirm no book-isolation violation was introduced by any newly
   -- inserted hadith (must return 0 — same check as §2)
   SELECT COUNT(*) FROM hadiths h
   JOIN chapters c ON h.chapter_id = c.id
   WHERE h.book_id != c.book_id;
   ```

**Honest limit to set expectations correctly:** HadeethEnc's curated set covers ~9,888 hadith-category memberships, not literally all 36,104 Fawaz hadiths — many older or rarer narrations exist only in the full hadith collections and were never added to HadeethEnc's topical encyclopedia. After this step, expect a meaningful share of hadiths to now have one or more categories, and the remainder to stay uncategorized until a second categorized source is added.

### Step 3 — Backfill hadith translations for every language / country (fixes §3.1)

**Goal:** push every language's coverage toward 100%, prioritizing the weakest ones (Vietnamese especially).

1. Decide the target language list. HadeethEnc supports up to 72 per hadith (verified live); start with the ones tied to real communities/countries you're serving:
   `en, ar, bn, ur, fr, tr, id, ru, ta, vi, de, es, zh, hi, fa, ms, sw, th, ha, pt, ...`
   — check per hadith which are actually available, coverage varies hadith to hadith.

2. For every hadith that now has a `hadeethenc_id` (from Step 2):
   ```
   for each target language code:
     GET /hadeeths/one/?language={code}&id={hadeethenc_id}
   ```
   This returns `title`, `hadeeth` (main text), `attribution`, `grade`, `explanation` in that language.

3. Insert into `hadith_translations`, but **only if a row for `(hadith_id, localization_code)` doesn't already exist** — never overwrite a translation you already have from Fawaz.
   ```sql
   INSERT INTO hadith_translations (hadith_id, localization_id, localization_code, translation_text, translation_quality)
   SELECT ?, l.id, ?, ?, 'verified'
   FROM localization l WHERE l.code = ?
   ON DUPLICATE KEY UPDATE translation_text = translation_text;  -- no-op if it exists; requires the (hadith_id, localization_code) unique key from §4.6
   ```

4. **This is specifically what fixes Vietnamese.** Run this step with `language=vi` for every `hadeethenc_id`-linked hadith. The text returned is real, professionally attributed Vietnamese translation with grade — not machine translation (verified directly during this audit). This should raise `vi` coverage from 2% to roughly the same range as your mid-tier languages (Turkish/Indonesian), for every hadith HadeethEnc covers.

5. For hadiths that have **no** `hadeethenc_id` (Fawaz-only hadiths HadeethEnc doesn't include), in priority order:
   - **First**, check whether Fawaz's own API has more language editions than what's already imported for that book (`GET` the editions list again, diff against what's already in `hadith_translations`) — cheapest and most reliable, same trusted source already in use.
   - **Second**, try Sunnah.com's API (requires signing up for a free API key) for additional language editions of the same books.
   - **Last resort only**, and only with explicit approval: professional/verified translation for whatever remains. Do not run bulk machine translation (e.g. Google Translate) over a religious text corpus and mark it `verified` — mark anything machine-assisted as `translation_quality = 'auto'` and treat it as provisional, since a mistranslation here is not a cosmetic bug.

6. Rate limit the same way as Step 2 (0.1–0.2s sleep). This is the longest-running step — budget hours, not minutes, since it's per-hadith × per-language. Run it one language at a time so progress is easy to check and safe to pause:
   ```bash
   python3 backfill_translations.py --lang=vi
   python3 backfill_translations.py --lang=ur
   python3 backfill_translations.py --lang=fr
   # ...one language per run
   ```

7. **Verify per language, compare against total hadith count (36,104):**
   ```sql
   SELECT localization_code, COUNT(*) AS translated,
          ROUND(COUNT(*) / 36104 * 100, 1) AS pct
   FROM hadith_translations
   GROUP BY localization_code
   ORDER BY translated DESC;
   ```

---

## 9. What "done" looks like — final acceptance checklist

Run all of these after Steps 1–3 are complete. Every check should pass before calling this task finished.

```sql
-- 1. Book isolation still intact (must be 0)
SELECT COUNT(*) FROM hadiths h JOIN chapters c ON h.chapter_id = c.id
WHERE h.book_id != c.book_id;

-- 2. Category tree has correct shape
SELECT COUNT(*) FROM categories WHERE parent_id IS NULL;      -- expect 7
SELECT COUNT(*) FROM categories;                                -- expect 452

-- 3. Every category actually has hadiths reachable under it, counting
--    hadiths on ITSELF OR ANY DESCENDANT — a parent category legitimately
--    has 0 direct links if all its hadiths sit on its children, so a plain
--    per-row COUNT(hc.hadith_id) (no rollup) would flag most real parent
--    categories as false positives. Use a recursive CTE to roll counts up
--    the tree before flagging anything as genuinely empty:
WITH RECURSIVE descendants AS (
  SELECT id AS ancestor_id, id AS self_id FROM categories
  UNION ALL
  SELECT d.ancestor_id, c.id
  FROM descendants d
  JOIN categories c ON c.parent_id = d.self_id
)
SELECT c.id, c.name_en, c.parent_id,
       COUNT(DISTINCT hc.hadith_id) AS hadiths_in_subtree
FROM categories c
JOIN descendants d ON d.ancestor_id = c.id
LEFT JOIN hadith_category hc ON hc.category_id = d.self_id
GROUP BY c.id
HAVING hadiths_in_subtree = 0
ORDER BY c.parent_id;
-- Only rows returned here (0 hadiths anywhere in that category's own
-- subtree, including itself) are real failures worth investigating.

-- 4. Pivot table populated
SELECT COUNT(*) FROM hadith_category;   -- expect several thousand, not 0

-- 5. Translation coverage per language meets your target threshold
--    (define what "done" means per language, e.g. >= 90%)
SELECT localization_code, COUNT(*) AS translated,
       ROUND(COUNT(*) / 36104 * 100, 1) AS pct
FROM hadith_translations GROUP BY localization_code ORDER BY pct DESC;
```

Then test the live API endpoints directly:
```bash
# Should now return real hadiths, not an empty array
curl "http://127.0.0.1:8000/api/v1/categories/1/hadiths"

# Should show hadiths_count > 0 for populated categories
curl "http://127.0.0.1:8000/api/v1/categories?parent_id=0"

# Book isolation spot check — every hadith here must belong to book_id=1 only
curl "http://127.0.0.1:8000/api/v1/books/1/hadiths?limit=5"
```

---

## 10. Quick reference — file locations

| What | Path |
|---|---|
| Laravel app | `laravel_api/` |
| Working import scripts (source of the current 36,104 hadiths) | `Scripts/fawaz_fixed_importer.py` |
| Category importer (has the bug described in §3.2 — do not reuse its subcategory-fetching logic) | `Scripts/hadeethenc_complete_importer.py` |
| Orchestrator that runs the two importers above, in order | `Scripts/master_hadith_orchestrator.py` |
| New scripts to write for Steps 1–3 | put them in `Scripts/`, e.g. `rebuild_category_tree.py`, `link_hadith_categories.py`, `backfill_translations.py` |
| DB credentials | `Scripts/config.py` and `laravel_api/.env` (`DB_DATABASE=hadith_db`, user `root`) |
| Superseded / do-not-run scripts | `laravel_api/scripts/*`, `ARCHIVE/root_scripts/*` |

---

## 11. Order of operations summary (one-page version)

```
0. Freeze source list (§6.1) + mysqldump backup (§6.2) — always, before touching data
1. Wipe stale/broken tables only (§6.3 Option A): hadith_category,
   category_localizations, categories — keep books/chapters/hadiths/translations as-is
2. Add new columns: hadiths.hadeethenc_id, categories.hadeethenc_category_id
3. Rebuild category tree: one API call → 452 rows → insert parent-first → verify 7 roots
4. Link hadiths↔categories: walk all 452 categories' hadith lists → match by the
   priority rule in §7.2 (exact Arabic text → book+number → new row) → fill
   hadith_category → verify book isolation still holds
5. Backfill translations: for every hadeethenc-linked hadith, pull every target
   language → insert only where missing → prioritize vi, ru, ta first
6. Run the cross-source verification queries in §7.3 — fix or delete any row
   query E flags as old placeholder output before moving on
7. Run the full acceptance checklist in §9 before considering this complete
8. Archive superseded scripts (§6.4) so nobody re-runs the old broken importers
```
