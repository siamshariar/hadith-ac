import { config } from "./config";

// The content language is a hadith language code (`vi`, `en`, `bn` ... see
// /hadith/languages). It is sent to the API as the {localizationCode} segment.
export const DEFAULT_LANGUAGE = config.language || "vi";
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
// cookie, then the app default.
export function resolveRequestLanguage({ query = {}, req } = {}) {
  const fromQuery = Array.isArray(query.lang) ? query.lang[0] : query.lang;
  if (isLanguageCode(fromQuery)) return normalizeLanguage(fromQuery);
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

// The interface itself is written in Vietnamese and English only.
export function uiLanguage(code) {
  return code === "vi" ? "vi" : "en";
}
