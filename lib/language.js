import { config } from "./config";
import { interfaceLanguageFor, interfaceLanguages, isRtlLanguage } from "./i18n";
import { site } from "./sites";

export { isRtlLanguage };

// The content language is a hadith language code (`vi`, `en`, `bn` ... see
// /hadith/languages). It is sent to the API as the {localizationCode} segment.
// The default is the country's (config/countries.json `language`).
export const DEFAULT_LANGUAGE = config.language || "en";
export const LANGUAGE_COOKIE = "hadith_lang";

// An international site (config/countries.json "international": ac) is one site for every
// language: the content and the interface follow the reader (below) instead of the country.
export const INTERNATIONAL = site.international === true;

const LANGUAGE_CODE = /^[a-z]{2,3}$/;

export function isLanguageCode(code) {
  return LANGUAGE_CODE.test(String(code || "").trim().toLowerCase());
}

export function normalizeLanguage(code) {
  const value = String(code || "").trim().toLowerCase();
  return LANGUAGE_CODE.test(value) ? value : DEFAULT_LANGUAGE;
}

const cookieOf = (req, name) => (req && req.cookies ? req.cookies[name] : null);
const acceptLanguageOf = (req) => (req && req.headers ? req.headers["accept-language"] : null);

// ---------------------------------------------------------------- the reader's languages

// The languages of an Accept-Language header, most wanted first, lower case and without
// the ones refused (q=0): "bn-BD,bn;q=0.9,en;q=0.8" -> ["bn-bd", "bn", "en"].
export function parseAcceptLanguage(header) {
  const wanted = [];
  String(header || "")
    .split(",")
    .slice(0, 50)
    .forEach((part, index) => {
      const [tag, ...params] = part.split(";");
      const code = tag.trim().toLowerCase();
      if (!/^[a-z]{1,8}(-[a-z0-9]{1,8})*$/.test(code)) return; // also "*"
      let q = 1;
      for (const param of params) {
        const match = param.trim().match(/^q=([0-9.]{1,5})$/i);
        if (match) q = Number(match[1]);
      }
      if (q > 0 && q <= 1) wanted.push({ code, q, index });
    });
  return wanted.sort((a, b) => b.q - a.q || a.index - b.index).map((item) => item.code);
}

// Browser tags that name a hadith language by another code: Filipino is the API's Tagalog,
// Central Kurdish its Kurdish (Sorani), Afghan Persian its Dari, Twi its Akan; "in" is the
// old code of Indonesian.
const TAG_ALIASES = { fil: "tl", ckb: "ku", "fa-af": "prs", tw: "ak", in: "id" };

// The first of `tags` (most wanted first) that names one of `codes`, by its whole tag or
// its language subtag: zh-TW -> zh, bn-BD -> bn, fil -> tl. null when none does.
export function matchLanguage(tags, codes) {
  const available = codes instanceof Set ? codes : new Set(codes || []);
  for (const tag of tags || []) {
    const primary = tag.split("-")[0];
    for (const code of [TAG_ALIASES[tag], tag, TAG_ALIASES[primary], primary]) {
      if (code && available.has(code)) return code;
    }
  }
  return null;
}

// The browser's languages, as Accept-Language has them (navigator.languages).
export function browserLanguages() {
  if (typeof navigator === "undefined") return [];
  const list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
  return list.filter(Boolean).map((tag) => String(tag).toLowerCase());
}

// ---------------------------------------------------------------- content language

// Server side: `?lang=` wins (shareable links), then the saved preference cookie, then the
// country's default. An international site puts the reader's browser languages (the best
// match of Accept-Language among `known`, the API's language codes) before its default.
export function resolveRequestLanguage({ query = {}, req } = {}, known = null) {
  const fromQuery = Array.isArray(query.lang) ? query.lang[0] : query.lang;
  if (!INTERNATIONAL) {
    if (isLanguageCode(fromQuery)) return normalizeLanguage(fromQuery);
    return normalizeLanguage(cookieOf(req, LANGUAGE_COOKIE));
  }
  if (isKnown(fromQuery, known)) return normalizeLanguage(fromQuery);
  return resolvePreferredLanguage({ req }, known);
}

// The reader's preference, without a one-off `?lang=` override.
export function resolvePreferredLanguage({ req } = {}, known = null) {
  const fromCookie = cookieOf(req, LANGUAGE_COOKIE);
  if (!INTERNATIONAL) return normalizeLanguage(fromCookie);
  if (isKnown(fromCookie, known)) return normalizeLanguage(fromCookie);
  return (known && matchLanguage(parseAcceptLanguage(acceptLanguageOf(req)), known)) || DEFAULT_LANGUAGE;
}

function isKnown(code, known) {
  return isLanguageCode(code) && (!known || known.has(normalizeLanguage(code)));
}

export function readLanguageCookie() {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${LANGUAGE_COOKIE}=([^;]*)`));
  return match && isLanguageCode(match[1]) ? match[1] : null;
}

export function writeLanguageCookie(code) {
  if (typeof document === "undefined") return;
  const value = normalizeLanguage(code);
  document.cookie = `${LANGUAGE_COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`;
}

// ---------------------------------------------------------------- interface language

// The interface language is the deployment's, whatever the content language: a
// Vietnamese reader who opens a hadith in English keeps the Vietnamese interface. It is
// the country's `ui` when lib/i18n or lib/locales has that catalog, else English. There
// is no right-to-left interface yet: a country whose `ui` is ar, ur or ku gets English
// (lib/i18n interfaceLanguageFor); Arabic, Urdu and Kurdish content keeps its own dir.
// An international site starts from this one and follows the reader (below).
export const INTERFACE_LANGUAGE = interfaceLanguageFor(site.ui);
export const INTERFACE_DIRECTION = "ltr";

// BCP 47 tag of the interface, for Intl date formats (numbers: lib/i18n formatNumber):
// the country's locale (ogLocale bn_BD -> bn-BD) when its interface is in use, else en-US.
// An international site uses each catalog's own (lib/i18n catalogLocale).
export const INTERFACE_LOCALE =
  INTERFACE_LANGUAGE === site.ui && site.ogLocale ? site.ogLocale.replace("_", "-") : "en-US";

// International site: the interfaces a reader can choose (lib/i18n interfaceLanguages:
// en, vi, bn ...), and the cookie that keeps the choice.
export const INTERFACE_LANGUAGES = INTERNATIONAL ? interfaceLanguages : [INTERFACE_LANGUAGE];
export const INTERFACE_COOKIE = "hadith_ui";

export const isInterfaceLanguage = (code) => INTERFACE_LANGUAGES.includes(code);

// Server side, per request: the deployment's interface; on an international site the
// reader's choice (hadith_ui), else the best match of Accept-Language among the
// catalogs, else the default (English).
export function resolveInterfaceLanguage({ req } = {}) {
  if (!INTERNATIONAL) return INTERFACE_LANGUAGE;
  const saved = cookieOf(req, INTERFACE_COOKIE);
  if (isInterfaceLanguage(saved)) return saved;
  return matchLanguage(parseAcceptLanguage(acceptLanguageOf(req)), INTERFACE_LANGUAGES) || INTERFACE_LANGUAGE;
}

// In the browser, for the pages rendered without a request (about, 404 ...): the same order,
// from the cookie and navigator.languages.
export function browserInterfaceLanguage() {
  if (!INTERNATIONAL) return INTERFACE_LANGUAGE;
  const saved = readInterfaceCookie();
  if (saved) return saved;
  return matchLanguage(browserLanguages(), INTERFACE_LANGUAGES) || INTERFACE_LANGUAGE;
}

export function readInterfaceCookie() {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${INTERFACE_COOKIE}=([^;]*)`));
  return match && isInterfaceLanguage(match[1]) ? match[1] : null;
}

export function writeInterfaceCookie(code) {
  if (typeof document === "undefined" || !isInterfaceLanguage(code)) return;
  document.cookie = `${INTERFACE_COOKIE}=${code}; path=/; max-age=31536000; samesite=lax`;
}

// Order of language lists (settings, search filters, sources): the country's content
// language first, then English, then by name.
export function compareLanguages(a, b) {
  const rank = (code) => (code === DEFAULT_LANGUAGE ? 0 : code === "en" ? 1 : 2);
  return rank(a.code) - rank(b.code) || String(a.name || a.code).localeCompare(String(b.name || b.code));
}
