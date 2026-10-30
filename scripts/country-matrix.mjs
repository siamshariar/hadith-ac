#!/usr/bin/env node
// Country matrix: serves the site once per country (NEXT_PUBLIC_COUNTRY_CODE, `next dev` in
// a separate git worktree on PORT) and checks that every page shows that country's data,
// compared with what the API returns for the country's localization:
//   - interface: <html lang>, og:locale, the site name in the title, the h1 naming the
//     country's content language
//   - content: the language the home page asked the API for, book names, category titles,
//     and the translation shown on Bukhari 1 and HadeethEnc 4560 (own, linked or fallback)
//   - no console errors
//
//   PLAYWRIGHT_CORE=/path/to/playwright-core node scripts/country-matrix.mjs [vn bd ...]
//
// Env: API (default http://127.0.0.1:8090/api), PORT (default 3001), WORKTREE (default a
// temporary directory; created and removed by the script). Exits 1 when a check fails.
import { spawn, execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const pw = require(process.env.PLAYWRIGHT_CORE || "playwright-core");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API = (process.env.API || "http://127.0.0.1:8090/api").replace(/\/+$/, "");
const PORT = Number(process.env.PORT || 3001);
const BASE = `http://127.0.0.1:${PORT}`;
const WORKTREE = process.env.WORKTREE || path.join(os.tmpdir(), `hadith-vn-countries-${process.pid}`);

const countries = JSON.parse(fs.readFileSync(path.join(root, "config", "countries.json"), "utf8"));
delete countries._comment;
const wanted = process.argv.slice(2);
const codes = wanted.length ? wanted : Object.keys(countries);

// Interfaces that exist (lib/i18n.js, lib/locales); right-to-left ones fall back to English
const INTERFACES = new Set(["vi", "en", "bn"]);
const RTL = new Set(["ar", "ur", "ku"]);
const interfaceFor = (ui) => (INTERFACES.has(ui) && !RTL.has(ui) ? ui : "en");

const api = async (p) => {
  const res = await fetch(`${API}${p}`);
  if (!res.ok) throw new Error(`${res.status} ${p}`);
  return res.json();
};
const norm = (s) => String(s || "").replace(/\s+/g, " ").trim();
// A stretch from the middle of a text: the start may be restyled ("Narrated X:" on its own line)
const snippet = (s) => {
  const t = norm(s);
  return t.length > 100 ? t.slice(40, 100) : t;
};

function startServer(code) {
  fs.rmSync(path.join(WORKTREE, ".next"), { recursive: true, force: true });
  const child = spawn("npx", ["next", "dev", "-p", String(PORT), "-H", "127.0.0.1"], {
    cwd: WORKTREE,
    detached: true,
    env: {
      ...process.env,
      NEXT_PUBLIC_COUNTRY_CODE: code,
      NEXT_PUBLIC_SITE_URL: BASE,
      NEXT_PUBLIC_API_BASE_URL: API,
      NEXT_TELEMETRY_DISABLED: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("dev server did not start")), 60000);
    child.stdout.on("data", (chunk) => {
      if (/Ready/.test(String(chunk))) {
        clearTimeout(timer);
        resolve(child);
      }
    });
    child.on("exit", (status) => reject(new Error(`dev server exited (${status})`)));
  });
}

const stopServer = (child) => {
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    // already gone
  }
};

async function checkCountry(browser, code, languages) {
  const entry = countries[code];
  const loc = entry.localization;
  const expectedUi = interfaceFor(entry.ui);
  const contentLanguage = languages.find((l) => l.code === entry.language);
  const results = [];
  const check = (name, ok, detail = "") => results.push({ name, ok: Boolean(ok), detail });

  const context = await browser.newContext({ locale: "en-US" });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 160)));
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));
  const open = async (p) => {
    const res = await page.goto(BASE + p, { waitUntil: "networkidle", timeout: 120000 });
    if (!res || res.status() !== 200) throw new Error(`${p}: HTTP ${res && res.status()}`);
    return norm(await page.innerText("body"));
  };

  // home: interface and the language the data was asked in
  await open("/");
  const htmlLang = await page.getAttribute("html", "lang");
  check("html lang", htmlLang === expectedUi, `${htmlLang} (want ${expectedUi})`);
  const ogLocale = await page.getAttribute('meta[property="og:locale"]', "content");
  check("og:locale", ogLocale === entry.ogLocale, `${ogLocale}`);
  const title = await page.title();
  const siteName = entry.siteName || "Hadith";
  check("site name in title", title.endsWith(`| ${siteName}`), title);
  const h1 = norm(await page.textContent("h1"));
  const languageNames = {
    vi: { vi: "tiếng việt" },
    bn: { bn: "বাংলা" },
  };
  // the API's English name without its variant: "Kurdish (Sorani)" is called "Kurdish"
  const wantName =
    (languageNames[expectedUi] || {})[entry.language] || contentLanguage.name.replace(/\s*\(.*\)$/, "");
  check("h1 names the content language", h1.toLowerCase().includes(wantName.toLowerCase()), h1);
  const nextData = JSON.parse(await page.textContent("#__NEXT_DATA__"));
  const homeLang = nextData.props.pageProps.home && nextData.props.pageProps.home.language.code;
  check("home data language", homeLang === entry.language, `${homeLang}`);

  // books and categories, named in the country's language
  const books = await api(`/hadith/books/localizations/${loc}`);
  const booksText = await open("/books");
  const missingBooks = books.filter((b) => !booksText.includes(norm(b.name))).map((b) => b.name);
  check("book names", !missingBooks.length, missingBooks.length ? `missing ${missingBooks.join(", ")}` : `${books.length} books`);
  const categories = (await api(`/hadith/categories/localizations/${loc}`)).filter((c) => !c.parentId).slice(0, 6);
  const categoriesText = await open("/categories");
  const missingCats = categories.filter((c) => !categoriesText.includes(norm(c.title))).map((c) => c.title);
  check("category titles", !missingCats.length, missingCats.length ? `missing ${missingCats.join(" | ")}` : `${categories.length} top categories`);

  // a book hadith and a HadeethEnc hadith: the translation the API gives for the country
  for (const p of ["/books/bukhari/hadiths/1", "/books/hadeethenc/hadiths/4560"]) {
    const d = await api(`/hadith${p}/localizations/${loc}`);
    const own = d.translation && d.translation.text ? d.translation : null;
    const linked = d.linkedTranslation && d.linkedTranslation.text ? d.linkedTranslation : null;
    const shown = own && !own.isFallback ? own : linked || own;
    const kind = shown === linked ? "linked" : own && own.isFallback ? "English fallback" : "own";
    const text = await open(p);
    if (!shown) {
      check(`${p} translation`, true, "Arabic only (no translation)");
      continue;
    }
    const lang = shown.languageCode;
    const inBlock = await page.evaluate(
      ({ lang, want }) =>
        [...document.querySelectorAll(`[lang="${lang}"]`)].some((el) =>
          el.innerText.replace(/\s+/g, " ").includes(want)
        ),
      { lang, want: snippet(shown.text) }
    );
    check(`${p} translation`, text.includes(snippet(shown.text)) && inBlock, `${lang} ${kind}`);
    if (d.title) check(`${p} title`, text.includes(norm(d.title).slice(0, 50)), norm(d.title).slice(0, 40));
  }

  check("no console errors", !errors.length, errors.slice(0, 2).join(" / "));
  await context.close();
  return results;
}

async function main() {
  const unknown = codes.filter((c) => !countries[c]);
  if (unknown.length) {
    console.error(`Unknown country code(s): ${unknown.join(", ")}`);
    process.exit(2);
  }
  const languages = await api("/hadith/languages");
  execFileSync("git", ["-C", root, "worktree", "add", "--detach", WORKTREE, "HEAD"], { stdio: "ignore" });
  fs.symlinkSync(path.join(root, "node_modules"), path.join(WORKTREE, "node_modules"));
  const browser = await pw.chromium.launch();
  let failed = 0;
  try {
    for (const code of codes) {
      const child = await startServer(code);
      try {
        const results = await checkCountry(browser, code, languages);
        const bad = results.filter((r) => !r.ok);
        failed += bad.length;
        console.log(`\n${code} (${countries[code].name}: content ${countries[code].language}) - ${bad.length ? `${bad.length} FAILED` : "all ok"}`);
        for (const r of results) console.log(`  ${r.ok ? "ok  " : "FAIL"} ${r.name}: ${r.detail}`);
      } catch (error) {
        failed += 1;
        console.log(`\n${code} - ERROR ${error.message}`);
      } finally {
        stopServer(child);
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
  } finally {
    await browser.close();
    fs.unlinkSync(path.join(WORKTREE, "node_modules")); // the link only, never the target
    execFileSync("git", ["-C", root, "worktree", "remove", "--force", WORKTREE], { stdio: "ignore" });
  }
  console.log(`\n${codes.length} countries, ${failed} failed check(s)`);
  process.exit(failed ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
