// Book and chapter names in the content language. The API names the collections and their
// chapters in English (the books in Arabic too); lib/names/<lang>.json has them in one
// language: { "books": { slug: name }, "bookSources": { slug: where the name comes from },
// "chapters": { slug: { chapterNo: name } } }. lib/api applies them to what it returns, on
// the server and in the browser, so every page shows them (applyNames below): a book's `name`
// becomes the file's (`nameEnglish` and `nameArabic` stay the source's), a chapter's too (the
// API's kept as `nameEnglish`). A name the file does not have, or a language without a file,
// keeps the API's.
//
// Each language's file is loaded the first time it is needed, as a chunk of its own in the
// browser. NAMES_FIXTURE=1 (test builds only, next.config.js) reads scripts/e2e/fixtures/names
// instead: a few names the end-to-end suite checks.
const LANGUAGE_CODE = /^[a-z]{2,3}$/;
const loaded = new Map();

const importNames = (lang) =>
  process.env.NAMES_FIXTURE === "1" ? import(`../scripts/e2e/fixtures/names/${lang}.json`) : import(`./names/${lang}.json`);

// The names of a language, or null when it has none.
export function loadNames(lang) {
  const code = String(lang || "");
  if (!LANGUAGE_CODE.test(code)) return Promise.resolve(null);
  if (!loaded.has(code)) {
    loaded.set(
      code,
      importNames(code).then(
        (module) => module.default || module,
        () => null
      )
    );
  }
  return loaded.get(code);
}

// A book's name in `names` (loadNames), or null.
export const nameOfBook = (names, slug) => (names && names.books && slug ? names.books[slug] : null) || null;

function nameBook(book, names) {
  if (!book || typeof book !== "object") return;
  const name = nameOfBook(names, book.slug);
  if (name) book.name = name;
}

function nameChapter(chapter, slug, names) {
  if (!chapter || typeof chapter !== "object") return;
  if (chapter.nameEnglish === undefined) chapter.nameEnglish = chapter.name ?? null;
  const chapters = names && names.chapters && slug ? names.chapters[slug] : null;
  const name = chapters ? chapters[String(chapter.chapterNo)] : null;
  if (name) chapter.name = name;
}

function nameHadith(hadith, names) {
  if (!hadith || typeof hadith !== "object") return;
  const slug = (hadith.book && hadith.book.slug) || hadith.bookSlug;
  nameBook(hadith.book, names);
  nameChapter(hadith.chapter, slug, names);
  // "Cũng có trong": { bookSlug, bookName, ... }
  (Array.isArray(hadith.related) ? hadith.related : []).forEach((item) => {
    const name = nameOfBook(names, item.bookSlug);
    if (name) item.bookName = name;
  });
}

// Puts the names into an API response, in place (each response is named once, before it is
// cached). `shape`: "books" (the list), "book" (with its chapters), "chapter" (a chapter's
// hadiths: book and chapter), "hadith" or "home" (its books and daily hadith).
export function applyNames(data, names, shape) {
  if (!data || typeof data !== "object") return data;
  if (shape === "books") {
    (Array.isArray(data) ? data : []).forEach((book) => nameBook(book, names));
  } else if (shape === "book") {
    nameBook(data, names);
    (Array.isArray(data.chapters) ? data.chapters : []).forEach((chapter) => nameChapter(chapter, data.slug, names));
  } else if (shape === "chapter") {
    nameBook(data.book, names);
    nameChapter(data.chapter, data.book && data.book.slug, names);
  } else if (shape === "hadith") {
    nameHadith(data, names);
  } else if (shape === "home") {
    (Array.isArray(data.books) ? data.books : []).forEach((book) => nameBook(book, names));
    nameHadith(data.dailyHadith, names);
  }
  return data;
}
