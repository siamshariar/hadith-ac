import { config } from "./config";
import { interfaceLanguageFor, isRtlLanguage } from "./i18n";
import { site } from "./sites";

export { isRtlLanguage };

// The content language is a hadith language code (`vi`, `en`, `bn` ... see
// /hadith/languages). It is sent to the API as the {localizationCode} segment.
// The default is the country's (config/countries.json `language`).
export const DEFAULT_LANGUAGE = config.language || "en";
export const LANGUAGE_COOKIE = "hadith_lang";

const LANGUAGE_CODE = /^[a-z]{2,3}$/;

export function isLanguageCode(code) {
  return LANGUAGE_CODE.test(String(code || "").trim().toLowerCase());
}

export function normalizeLanguage(code) {
  const value = String(code || "").trim().toLowerCase();
  return LANGUAGE_CODE.test(value) ? value : DEFAULT_LANGUAGE;
}

// Server side: `?lang=` wins (shareable links), then the saved preference
// cookie, then the country's default.
export function resolveRequestLanguage({ query = {}, req } = {}) {
  const fromQuery = Array.isArray(query.lang) ? query.lang[0] : query.lang;
  if (isLanguageCode(fromQuery)) return normalizeLanguage(fromQuery);
  const fromCookie = req && req.cookies ? req.cookies[LANGUAGE_COOKIE] : null;
  return normalizeLanguage(fromCookie);
}

// The reader's saved preference (ignores a one-off `?lang=` override).
export function resolvePreferredLanguage({ req } = {}) {
  const fromCookie = req && req.cookies ? req.cookies[LANGUAGE_COOKIE] : null;
  return normalizeLanguage(fromCookie);
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

// The interface language is the deployment's, whatever the content language: a
// Vietnamese reader who opens a hadith in English keeps the Vietnamese interface. It is
// the country's `ui` when lib/i18n or lib/locales has that catalog, else English. There
// is no right-to-left interface yet: a country whose `ui` is ar, ur or ku gets English
// (lib/i18n interfaceLanguageFor); Arabic, Urdu and Kurdish content keeps its own dir.
export const INTERFACE_LANGUAGE = interfaceLanguageFor(site.ui);
export const INTERFACE_DIRECTION = "ltr";

// BCP 47 tag of the interface, for Intl date formats (numbers: lib/i18n formatNumber):
// the country's locale (ogLocale bn_BD -> bn-BD) when its interface is in use, else en-US.
export const INTERFACE_LOCALE =
  INTERFACE_LANGUAGE === site.ui && site.ogLocale ? site.ogLocale.replace("_", "-") : "en-US";

// Kept for callers that pass the content language: the interface no longer follows it.
export function uiLanguage() {
  return INTERFACE_LANGUAGE;
}

// Order of language lists (settings, search filters, sources): the country's content
// language first, then English, then by name.
export function compareLanguages(a, b) {
  const rank = (code) => (code === DEFAULT_LANGUAGE ? 0 : code === "en" ? 1 : 2);
  return rank(a.code) - rank(b.code) || String(a.name || a.code).localeCompare(String(b.name || b.code));
}
