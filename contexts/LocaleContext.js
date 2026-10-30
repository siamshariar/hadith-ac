import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
  DEFAULT_LANGUAGE,
  INTERFACE_DIRECTION,
  INTERFACE_LANGUAGE,
  INTERFACE_LOCALE,
  isRtlLanguage,
  normalizeLanguage,
  readLanguageCookie,
  writeLanguageCookie,
} from "../lib/language";
import { formatNumber, languageName, translate } from "../lib/i18n";
import { site } from "../lib/sites";

export const LocaleContext = createContext(null);

// The interface language is the deployment's (lib/language.js), the same on the server
// and in the browser, whatever the content language.
const ui = INTERFACE_LANGUAGE;

// A language's name from the API's language object ({ code, name, nativeName }): its
// English name in the English interface, its own name in the others.
const apiName = (language) => (language ? (ui === "en" ? language.name : language.nativeName) || null : null);

// The catalog's name for `code`, else the API's: `fallback` (a language object or a
// name), else the page language's description.
function nameOf(code, fallback, info) {
  const given = fallback && typeof fallback === "object" ? apiName(fallback) : fallback;
  return languageName(ui, code, given || (info && code === info.code ? apiName(info) : null));
}

// Filled into every interface string (callers' variables win): the site name and the
// name of the country's content language ("Hadith tiếng Việt", "বাংলা হাদিস").
const siteVars = { site: site.siteName, siteLanguage: nameOf(site.language, null, null) };
const t = (key, vars) => translate(ui, key, vars ? { ...siteVars, ...vars } : siteVars);

// Text direction of content in `code`, when known.
function directionOf(code, info) {
  if (info && code === info.code) return info.direction || "ltr";
  if (isRtlLanguage(code)) return "rtl";
  if (code === "en" || code === "vi" || code === "bn") return "ltr";
  return "auto";
}

// `pageLang` is the content language a server-rendered page was fetched in
// (from `?lang=`, the preference cookie or the country's default) and `languageInfo`
// the API's description of it ({ code, name, nativeName, direction }). Static
// pages have neither and read the cookie after mounting.
export default function LocaleProvider({ pageLang, languageInfo, children }) {
  const router = useRouter();
  const [preferred, setPreferred] = useState(null);

  useEffect(() => {
    setPreferred(readLanguageCookie());
  }, []);

  const lang = normalizeLanguage(pageLang || preferred || DEFAULT_LANGUAGE);
  // The saved preference (cookie), not a one-off ?lang= override.
  const preferredLang = normalizeLanguage(preferred || DEFAULT_LANGUAGE);

  const setLanguage = useCallback(
    (code) => {
      const next = normalizeLanguage(code);
      writeLanguageCookie(next);
      setPreferred(next);
      // Re-run getServerSideProps in the new language; drop a `?lang=` override.
      const { lang: _ignored, ...query } = router.query;
      router.replace({ pathname: router.pathname, query }, undefined, { scroll: false });
    },
    [router]
  );

  const value = useMemo(() => {
    const info = languageInfo && languageInfo.code === lang ? languageInfo : null;
    return {
      lang,
      preferredLang,
      ui,
      dir: INTERFACE_DIRECTION,
      locale: INTERFACE_LOCALE, // BCP 47, for Intl date formats
      languageInfo: info,
      directionOf: (code) => directionOf(code, info),
      setLanguage,
      t,
      // languageName(code, fallback?): fallback is the API's language object or a name
      languageName: (code, fallback) => nameOf(code, fallback, info),
      formatNumber: (number) => formatNumber(number, ui),
    };
  }, [lang, preferredLang, languageInfo, setLanguage]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (context) return context;
  // Outside the provider (should not happen): default language, no switching.
  return {
    lang: DEFAULT_LANGUAGE,
    preferredLang: DEFAULT_LANGUAGE,
    ui,
    dir: INTERFACE_DIRECTION,
    locale: INTERFACE_LOCALE,
    languageInfo: null,
    directionOf: (code) => directionOf(code, null),
    setLanguage: () => {},
    t,
    languageName: (code, fallback) => nameOf(code, fallback, null),
    formatNumber: (number) => formatNumber(number, ui),
  };
}
