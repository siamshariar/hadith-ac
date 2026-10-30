#!/usr/bin/env node
// Country matrix: serves the site once per country (NEXT_PUBLIC_COUNTRY_CODE, `next dev` in
// a separate git worktree on PORT) and checks that every page shows that country's data,
// compared with what the API returns for the country's localization:
//   - interface: <html lang>, og:locale, the site name in the title, the h1 naming the
//     country's content language
//   - content: the language the home page asked the API for, book names, category titles,
//     and the translation shown on Bukhari 1 and HadeethEnc 4560 (own, linked or fallback)
//   - no console errors
// The international edition (ac, "international": true) has no country to compare with:
// it is checked for readers whose browsers ask for en-US, bn-BD, vi-VN, fr-FR and ur-PK
// instead (checkInternational below).
//
//   PLAYWRIGHT_CORE=/path/to/playwright-core node scripts/country-matrix.mjs [vn bd ac ...]
//
// Env: API (default http://127.0.0.1:8090/api), PORT (default 3001), WORKTREE (default a
// temporary directory; created and removed by the script). Exits 1 when a check fails.
import { spawn, execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// lib/i18n.js is an ES module in a package without "type": "module"; Node says so once.
process.removeAllListeners("warning");
process.on("warning", (warning) => {
  if (warning.code !== "MODULE_TYPELESS_PACKAGE_JSON") console.warn(warning.stack || String(warning));
});

const require = createRequire(import.meta.url);
const pw = require(process.env.PLAYWRIGHT_CORE || "playwright-core");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API = (process.env.API || "http://127.0.0.1:8090/api").replace(/\/+$/, "");
const PORT = Number(process.env.PORT || 3001);
const BASE = `http://127.0.0.1:${PORT}`;
const WORKTREE = process.env.WORKTREE || path.join(os.tmpdir(), `hadith-vn-countries-${process.pid}`);

const countries = JSON.parse(fs.readFileSync(path.join(root, "config", "countries.json"), "utf8"));
const i18n = await import(pathToFileURL(path.join(root, "lib", "i18n.js")).href);
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

// ---------------------------------------------------------------- international (ac)

// Readers of the international edition, by the language their browser asks for: the content
// language is the best match among the API's languages, the interface their own catalog when
// there is one (bn, vi), else English (fr; ur: no right-to-left interface yet).
const READERS = [
  { locale: "en-US", content: "en", ui: "en" },
  { locale: "bn-BD", content: "bn", ui: "bn" },
  { locale: "vi-VN", content: "vi", ui: "vi" },
  { locale: "fr-FR", content: "fr", ui: "en" },
  { locale: "ur-PK", content: "ur", ui: "en" },
];

// The interface string as LocaleContext's t() gives it (the site's name filled in).
const tr = (ui, key, vars = {}) => i18n.translate(ui, key, { site: "Hadith", ...vars });

async function checkInternational(browser, code, languages) {
  const entry = countries[code];
  const siteName = entry.siteName || "Hadith";
  const t = (ui, key, vars = {}) => tr(ui, key, { site: siteName, ...vars });
  const results = [];
  const check = (name, ok, detail = "") => results.push({ name, ok: Boolean(ok), detail });
  const byCode = new Map(languages.map((l) => [l.code, l]));
  const directoryOrder = [...languages]
    .sort((a, b) => (b.totalTranslated || 0) - (a.totalTranslated || 0) || a.name.localeCompare(b.name))
    .map((l) => l.code);
  const contexts = [];

  // a browser context for one reader; console errors fail the "no console errors" check
  const errors = [];
  async function reader(locale, { cookies = [], viewport } = {}) {
    const context = await browser.newContext({ locale, ...(viewport ? { viewport } : {}) });
    contexts.push(context);
    if (cookies.length) await context.addCookies(cookies.map((cookie) => ({ ...cookie, url: BASE })));
    const page = await context.newPage();
    page.on("console", (m) => m.type() === "error" && errors.push(`${locale}: ${m.text().slice(0, 160)}`));
    page.on("pageerror", (e) => errors.push(`${locale}: ${String(e).slice(0, 160)}`));
    const open = async (p) => {
      const res = await page.goto(BASE + p, { waitUntil: "networkidle", timeout: 120000 });
      if (!res || res.status() !== 200) throw new Error(`${p}: HTTP ${res && res.status()}`);
      return norm(await page.innerText("body"));
    };
    const props = async () => JSON.parse(await page.textContent("#__NEXT_DATA__")).props.pageProps;
    const cookie = async (name) => ((await context.cookies(BASE)).find((c) => c.name === name) || {}).value;
    return { context, page, open, props, cookie };
  }

  // The translation the API gives for a hadith in `lang`, shown in a block of that language.
  async function shows(page, p, lang) {
    const d = await api(`/hadith${p}/localizations/${lang}`);
    const own = d.translation && d.translation.text ? d.translation : null;
    const linked = d.linkedTranslation && d.linkedTranslation.text ? d.linkedTranslation : null;
    const shown = own && !own.isFallback ? own : linked || own;
    if (!shown) return { ok: true, detail: "Arabic only" };
    const ok = await page.evaluate(
      ({ lang, want }) =>
        [...document.querySelectorAll(`main [lang="${lang}"]`)].some((el) => el.innerText.replace(/\s+/g, " ").includes(want)),
      { lang: shown.languageCode, want: snippet(shown.text) }
    );
    return { ok, detail: `${shown.languageCode} ${shown === linked ? "linked" : own && own.isFallback ? "English fallback" : "own"}` };
  }

  try {
    for (const want of READERS) {
      const tag = want.locale;
      const { page, open, props } = await reader(want.locale);
      const extras = want.content === "en" ? [] : ["en"];

      await open("/");
      const htmlLang = await page.getAttribute("html", "lang");
      check(`${tag} <html lang>`, htmlLang === want.ui, `${htmlLang} (want ${want.ui})`);
      const ogLocale = await page.getAttribute('meta[property="og:locale"]', "content");
      const wantOg = i18n.catalogLocale(want.ui).replace("-", "_");
      check(`${tag} og:locale`, ogLocale === wantOg, `${ogLocale} (want ${wantOg})`);
      const title = await page.title();
      check(`${tag} title`, title === t(want.ui, "homeTitleAll"), title);
      const h1 = norm(await page.textContent("h1"));
      check(`${tag} h1`, h1 === t(want.ui, "siteHeadingAll"), h1);
      const home = await props();
      check(
        `${tag} content language`,
        home.lang === want.content && home.home.language.code === want.content,
        `${home.lang}, home data ${home.home.language.code} (want ${want.content})`
      );
      check(`${tag} interface`, home.uiLang === want.ui, `${home.uiLang}`);
      check(`${tag} default extras`, home.translations.join(",") === extras.join(","), `[${home.translations}]`);

      // the language directory: every language of the API, most translated first, counted as the API counts
      const entries = await page.$$eval("#language-directory a[data-language]", (links) =>
        links.map((a) => ({ code: a.dataset.language, href: a.getAttribute("href"), text: a.innerText.replace(/\s+/g, " ").trim() }))
      );
      const wrong = entries.filter((e) => {
        const l = byCode.get(e.code);
        return !l || e.href !== `/?lang=${e.code}` || !e.text.includes(norm(l.nativeName)) || !e.text.includes(i18n.formatNumber(l.totalTranslated, want.ui));
      });
      check(
        `${tag} language directory`,
        entries.length === languages.length && !wrong.length && entries.map((e) => e.code).join() === directoryOrder.join(),
        `${entries.length} of ${languages.length} languages${wrong.length ? `; wrong: ${wrong.slice(0, 3).map((e) => e.code).join(", ")}` : ", counts as the API"}`
      );
      const current = await page.$$eval('#language-directory a[aria-current="true"]', (links) => links.map((a) => a.dataset.language));
      check(`${tag} directory marks the language`, current.join() === want.content, `[${current}]`);

      // a hadith in the content language, with English under it
      await open("/books/bukhari/hadiths/1");
      const hadith = await props();
      const chip = await page.getAttribute("[data-translations]", "data-translations");
      check(`${tag} hadith translations`, hadith.lang === want.content && chip === [want.content, ...extras].join(","), `${chip}`);
      const main = await shows(page, "/books/bukhari/hadiths/1", want.content);
      check(`${tag} hadith in ${want.content}`, main.ok, main.detail);
      if (extras.length) {
        const en = await shows(page, "/books/bukhari/hadiths/1", "en");
        check(`${tag} English beside it`, en.ok, en.detail);
      }
      const hadithLang = await page.getAttribute("html", "lang");
      check(`${tag} hadith <html lang>`, hadithLang === want.ui, hadithLang);
    }

    // the interface menu: a French reader picks বাংলা; kept after a reload and on a static page
    {
      const { page, open, props, cookie } = await reader("fr-FR", { viewport: { width: 1366, height: 900 } });
      await open("/books/bukhari/hadiths/1");
      const button = page.locator("button[data-interface]").filter({ visible: true }).first();
      const label = await button.getAttribute("aria-label");
      check("menu: button named", label === `${t("en", "interfaceLanguage")}: English`, label);
      await button.click();
      const items = await page.locator('[role="menuitemradio"]').evaluateAll((els) => els.map((el) => [el.dataset.interface, el.innerText.trim()]));
      const wantItems = i18n.interfaceLanguages.map((ui) => [ui, i18n.catalogName(ui)]);
      check("menu: catalogs by their own names", JSON.stringify(items) === JSON.stringify(wantItems), items.map((i) => i[1]).join(", "));
      await Promise.all([
        page.waitForEvent("load", { timeout: 120000 }),
        page.locator('[role="menuitemradio"][data-interface="bn"]').click(),
      ]);
      await page.waitForLoadState("networkidle");
      let after = await props();
      check(
        "menu: interface saved",
        (await page.getAttribute("html", "lang")) === "bn" && after.uiLang === "bn" && (await cookie("hadith_ui")) === "bn",
        `html ${await page.getAttribute("html", "lang")}, cookie ${await cookie("hadith_ui")}`
      );
      check("menu: content unchanged", after.lang === "fr", after.lang);
      await page.reload({ waitUntil: "networkidle" });
      after = await props();
      const reloaded = await page.getAttribute("html", "lang");
      check("menu: kept after a reload", reloaded === "bn" && after.uiLang === "bn", `html ${reloaded}`);
      await open("/about");
      await page.waitForFunction(() => document.documentElement.lang === "bn", null, { timeout: 30000 }).catch(() => {});
      const aboutTitle = await page.title();
      check("menu: static pages follow", aboutTitle.startsWith(`${t("bn", "about")} | ${t("bn", "siteHeadingAll")}`), aboutTitle);
    }

    // ?lang= overrides for one view; the hadith_lang cookie beats the browser; the reader's own
    // extras (none) beat the default
    {
      const { page, open, props } = await reader("en-US");
      await open("/?lang=de");
      const p = await props();
      check(
        "?lang= overrides",
        p.lang === "de" && p.home.language.code === "de" && p.uiLang === "en" && (await page.getAttribute("html", "lang")) === "en" && p.translations.join() === "en",
        `content ${p.lang}, interface ${p.uiLang}, extras [${p.translations}]`
      );
    }
    {
      const { open, props } = await reader("bn-BD", { cookies: [{ name: "hadith_lang", value: "fr" }] });
      await open("/");
      const p = await props();
      check("hadith_lang beats the browser", p.lang === "fr" && p.uiLang === "bn", `content ${p.lang}, interface ${p.uiLang}`);
    }
    {
      const { open, props } = await reader("vi-VN", { cookies: [{ name: "hadith_tr", value: "" }] });
      await open("/books/bukhari/hadiths/1");
      const p = await props();
      check("the reader's extras win", p.lang === "vi" && p.translations.length === 0, `empty hadith_tr: [${p.translations}]`);
    }

    // a directory link opens the home page in its language and saves it
    {
      const { page, open, props, cookie } = await reader("en-US");
      await open("/");
      await page.locator('#language-directory a[data-language="fr"]').click();
      await page.waitForURL((url) => url.search === "?lang=fr", { timeout: 120000 });
      await page.waitForLoadState("networkidle");
      await page.waitForFunction(() => window.__NEXT_DATA__ && document.querySelector('#language-directory a[aria-current="true"][data-language="fr"]'), null, { timeout: 60000 });
      const saved = await cookie("hadith_lang");
      await open("/books/bukhari/hadiths/1");
      const p = await props();
      check("directory link", saved === "fr" && p.lang === "fr", `cookie ${saved}, next page in ${p.lang}`);
    }
  } finally {
    for (const context of contexts) await context.close().catch(() => {});
  }

  check("no console errors", !errors.length, errors.slice(0, 2).join(" / ") || `${contexts.length} browser contexts`);
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
        const results = countries[code].international
          ? await checkInternational(browser, code, languages)
          : await checkCountry(browser, code, languages);
        const bad = results.filter((r) => !r.ok);
        failed += bad.length;
        const what = countries[code].international ? "every language" : `content ${countries[code].language}`;
        console.log(`\n${code} (${countries[code].name}: ${what}) - ${bad.length ? `${bad.length} FAILED` : "all ok"}`);
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
