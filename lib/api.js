// Client for the hadith endpoints of the Quran API (see quran-api/docs/HADITH_API.md).
// Every content endpoint is GET /hadith/.../localizations/{loc}; the response
// echoes the language actually used. Nothing here falls back to local data:
// when the API fails, callers get an ApiError and show an error state.

import { config } from "./config";
import {
  DEFAULT_LANGUAGE,
  normalizeLanguage,
  resolvePreferredLanguage,
  resolveRequestLanguage,
  uiLanguage,
} from "./language";

const HADITH_API = `${config.apiBaseUrl}/hadith`;

export class ApiError extends Error {
  constructor(message, { status = 0, url = "" } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.url = url;
  }
}

function buildUrl(path, query) {
  const url = new URL(`${HADITH_API}${path}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

async function request(path, { query, signal } = {}) {
  const url = buildUrl(path, query);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.apiFetchTimeout);
  const forwardAbort = () => controller.abort();
  if (signal) signal.addEventListener("abort", forwardAbort);

  let response;
  try {
    // Only send CORS-safelisted headers: the API allows no extra request headers.
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
  } catch (error) {
    if (signal && signal.aborted) throw error; // cancelled by the caller
    const timedOut = error && error.name === "AbortError";
    throw new ApiError(
      timedOut ? "The hadith API did not respond in time." : "The hadith API could not be reached.",
      { url }
    );
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener("abort", forwardAbort);
  }

  if (!response.ok) {
    let message = `The hadith API answered with HTTP ${response.status}.`;
    try {
      const body = await response.json();
      if (body && body.message) message = body.message;
    } catch (_) {
      // keep the generic message
    }
    throw new ApiError(message, { status: response.status, url });
  }

  try {
    return await response.json();
  } catch (_) {
    throw new ApiError("The hadith API returned an invalid response.", { status: response.status, url });
  }
}

// Small in-memory cache for reference data that rarely changes (languages,
// books, the category list). Failed requests are not cached.
const MEMO_TTL = 10 * 60 * 1000;
const memoStore = new Map();

function memo(key, load) {
  const hit = memoStore.get(key);
  if (hit && Date.now() - hit.at < MEMO_TTL) return hit.promise;
  const promise = load().catch((error) => {
    memoStore.delete(key);
    throw error;
  });
  memoStore.set(key, { at: Date.now(), promise });
  return promise;
}

const segment = (value) => encodeURIComponent(String(value));
const localization = (language) => `/localizations/${segment(normalizeLanguage(language))}`;

// ---------------------------------------------------------------- endpoints

export function getLanguages() {
  return memo("languages", () => request("/languages"));
}

export function getHome(language, options) {
  return request(`/home${localization(language)}`, options);
}

export function getBooks(language) {
  const lang = normalizeLanguage(language);
  return memo(`books:${lang}`, () => request(`/books${localization(lang)}`));
}

export function getBook(book, language) {
  const lang = normalizeLanguage(language);
  return memo(`book:${book}:${lang}`, () => request(`/books/${segment(book)}${localization(lang)}`));
}

// `translated`: only hadiths readable in the language (own or linked translation).
export function getChapterHadiths(book, chapterNo, language, { page, perPage, translated, signal } = {}) {
  return request(`/books/${segment(book)}/chapters/${segment(chapterNo)}${localization(language)}`, {
    query: { page, perPage, translated: translated ? 1 : undefined },
    signal,
  });
}

export function getBookHadith(book, number, language, options) {
  return request(`/books/${segment(book)}/hadiths/${segment(number)}${localization(language)}`, options);
}

export function getCategories(language) {
  const lang = normalizeLanguage(language);
  return memo(`categories:${lang}`, () => request(`/categories${localization(lang)}`));
}

export function getCategory(category, language, options) {
  return request(`/categories/${segment(category)}${localization(language)}`, options);
}

// `direct`: leave out the subcategories' hadiths; `translated`: only hadiths
// translated into the language.
export function getCategoryHadiths(category, language, { page, perPage, direct, translated, signal } = {}) {
  return request(`/categories/${segment(category)}/hadiths${localization(language)}`, {
    query: { page, perPage, direct: direct ? 1 : undefined, translated: translated ? 1 : undefined },
    signal,
  });
}

export function getHadith(id, language, options) {
  return request(`/hadiths/${segment(id)}${localization(language)}`, options);
}

export function getDailyHadith(language, options) {
  return request(`/daily${localization(language)}`, options);
}

export const MIN_SEARCH_LENGTH = 2;

export function searchHadiths(q, language, { page, perPage, book, signal } = {}) {
  return request(`/search${localization(language)}`, {
    query: { q, page, perPage, book },
    signal,
  });
}

// ---------------------------------------------------------------- helpers

// Flat category list (with parentId) -> top-level nodes with nested children.
export function buildCategoryTree(categories) {
  const nodes = new Map();
  (categories || []).forEach((category) => nodes.set(category.id, { ...category, children: [] }));
  const roots = [];
  nodes.forEach((node) => {
    const parent = node.parentId != null ? nodes.get(node.parentId) : null;
    if (parent) parent.children.push(node);
    else roots.push(node);
  });
  return roots;
}

// Minimal book records ({ slug, code, name, source }) for the books that a
// list of hadiths comes from, so cards can cite "Sahih al-Bukhari 1".
export async function booksForHadiths(hadiths, language) {
  const slugs = new Set((hadiths || []).map((hadith) => hadith.bookSlug));
  if (!slugs.size) return {};
  const books = await getBooks(language);
  const map = {};
  books.forEach((book) => {
    if (slugs.has(book.slug)) {
      map[book.slug] = { slug: book.slug, code: book.code, name: book.name, source: book.source };
    }
  });
  return map;
}

export function parsePage(value) {
  const page = parseInt(Array.isArray(value) ? value[0] : value, 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

// Wraps getServerSideProps: resolves the content language, runs the loader
// and turns API failures into a 404 or an error state (never local data).
// The loader returns `{ props }`, `{ notFound: true }` or `{ redirect }`.
export async function loadPage(context, loader) {
  let lang = resolveRequestLanguage(context);
  // The interface follows the saved preference, not a one-off ?lang= override.
  const uiLang = uiLanguage(resolvePreferredLanguage(context));
  let languageInfo = null;
  try {
    // Unknown codes would silently come back in English; use the default instead.
    const languages = await getLanguages();
    languageInfo = languages.find((language) => language.code === lang) || null;
    if (!languageInfo) {
      lang = DEFAULT_LANGUAGE;
      languageInfo = languages.find((language) => language.code === lang) || null;
    }
  } catch (_) {
    // Not fatal: the page loader reports API failures itself.
  }

  try {
    const result = (await loader(lang)) || { notFound: true };
    if (!result.props) return result;
    return { props: { lang, uiLang, languageInfo, ...result.props } };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { notFound: true };
    }
    console.error(`[hadith-api] ${error.message}${error.url ? ` (${error.url})` : ""}`);
    if (context.res) context.res.statusCode = 502;
    return {
      props: {
        lang,
        uiLang,
        languageInfo,
        error: { message: error.message || "Unknown error", status: error.status || 0 },
      },
    };
  }
}
