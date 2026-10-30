import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
  DEFAULT_LANGUAGE,
  INTERFACE_DIRECTION,
  INTERFACE_LANGUAGE,
  INTERFACE_LOCALE,
  INTERNATIONAL,
  browserInterfaceLanguage,
  isInterfaceLanguage,
  isRtlLanguage,
  normalizeLanguage,
  readLanguageCookie,
  writeLanguageCookie,
} from "../lib/language";
import { INTERNATIONAL_KEYS, catalogLocale, formatNumber, languageName, translate } from "../lib/i18n";
import { site } from "../lib/sites";

export const LocaleContext = createContext(null);

// The interface language is the deployment's (lib/language.js), the same on the server
// and in the browser, whatever the content language. On an international site it is the
// reader's: the server picks it for each page (`pageUi`, lib/api loadPage).

// A language's name from the API's language object ({ code, name, nativeName }): its
// English name in the English interface, its own name in the others.
const apiName = (ui, language) => (language ? (ui === "en" ? language.name : language.nativeName) || null : null);

// The catalog's name for `code`, else the API's: `fallback` (a language object or a
// name), else the page language's description.
function nameOf(ui, code, fallback, info) {
  const given = fallback && typeof fallback === "object" ? apiName(ui, fallback) : fallback;
  return languageName(ui, code, given || (info && code === info.code ? apiName(ui, info) : null));
}

// t() of an interface. It fills in the site name and the name of the country's content
// language ("Hadith tiếng Việt", "বাংলা হাদিস"; callers' variables win). An international
// site reads the keys of INTERNATIONAL_KEYS (lib/i18n.js) in place of the ones that name it.
const translators = {};
function translatorFor(ui) {
  if (!translators[ui]) {
    const siteVars = { site: site.siteName, siteLanguage: nameOf(ui, site.language, null, null) };
    translators[ui] = (key, vars) =>
      translate(ui, (INTERNATIONAL && INTERNATIONAL_KEYS[key]) || key, vars ? { ...siteVars, ...vars } : siteVars);
  }
  return translators[ui];
}

// BCP 47 locale (Intl date formats) and og:locale: the deployment's; on an international
// site those of the reader's catalog (en_US, vi_VN, bn_BD).
const localeOf = (ui) => (INTERNATIONAL ? catalogLocale(ui) : INTERFACE_LOCALE);
const ogLocaleOf = (ui) => (INTERNATIONAL ? catalogLocale(ui).replace("-", "_") : site.ogLocale);

// Text direction of content in `code`, when known.
function directionOf(code, info) {
  if (info && code === info.code) return info.direction || "ltr";
  if (isRtlLanguage(code)) return "rtl";
  if (code === "en" || code === "vi" || code === "bn") return "ltr";
  return "auto";
}

// `pageLang` is the content language a server-rendered page was fetched in
// (from `?lang=`, the preference cookie or the country's default) and `languageInfo`
// the API's description of it ({ code, name, nativeName, direction }). On an
// international site, `pageUi` is the interface the server chose for the reader and
// `pagePreferred` their content language without a one-off ?lang=. Static pages have
// none of these and read the cookies after mounting.
export default function LocaleProvider({ pageLang, pageUi, pagePreferred, languageInfo, children }) {
  const router = useRouter();
  const [preferred, setPreferred] = useState(null);
  // International site: the interface and preference of the last server-rendered page,
  // for the static pages (about, 404 ...) opened after it. A static page opened first was
  // rendered in the default interface: once mounted it takes the reader's (cookie, else
  // browser languages).
  const [lastUi, setLastUi] = useState(null);
  const [lastPreferred, setLastPreferred] = useState(null);

  useEffect(() => {
    setPreferred(readLanguageCookie());
  }, []);

  useEffect(() => {
    if (!INTERNATIONAL) return;
    if (isInterfaceLanguage(pageUi)) setLastUi(pageUi);
    else setLastUi((current) => current || browserInterfaceLanguage());
  }, [pageUi]);

  useEffect(() => {
    if (INTERNATIONAL && pagePreferred) setLastPreferred(pagePreferred);
  }, [pagePreferred]);

  const ui = !INTERNATIONAL ? INTERFACE_LANGUAGE : isInterfaceLanguage(pageUi) ? pageUi : lastUi || INTERFACE_LANGUAGE;

  // A static page that switched interface: its <html lang> too (pages/_document.js).
  useEffect(() => {
    if (INTERNATIONAL && document.documentElement.lang !== ui) document.documentElement.lang = ui;
  }, [ui]);

  const saved = INTERNATIONAL ? pagePreferred || preferred || lastPreferred : preferred;
  const lang = normalizeLanguage(pageLang || saved || DEFAULT_LANGUAGE);
  // The saved preference (cookie), not a one-off ?lang= override. On an international
  // site it can also come from the browser's languages, and is null while not known yet
  // (a static page opened first).
  const preferredLang = INTERNATIONAL
    ? saved
      ? normalizeLanguage(saved)
      : null
    : normalizeLanguage(preferred || DEFAULT_LANGUAGE);

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

  // Saves the preference only, for a link that opens a page in that language itself.
  const rememberLanguage = useCallback((code) => {
    const next = normalizeLanguage(code);
    writeLanguageCookie(next);
    setPreferred(next);
  }, []);

  const value = useMemo(() => {
    const info = languageInfo && languageInfo.code === lang ? languageInfo : null;
    return {
      lang,
      preferredLang,
      ui,
      dir: INTERFACE_DIRECTION,
      locale: localeOf(ui), // BCP 47, for Intl date formats
      ogLocale: ogLocaleOf(ui),
      languageInfo: info,
      directionOf: (code) => directionOf(code, info),
      setLanguage,
      rememberLanguage,
      t: translatorFor(ui),
      // languageName(code, fallback?): fallback is the API's language object or a name
      languageName: (code, fallback) => nameOf(ui, code, fallback, info),
      formatNumber: (number) => formatNumber(number, ui),
    };
  }, [lang, preferredLang, ui, languageInfo, setLanguage, rememberLanguage]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (context) return context;
  // Outside the provider (should not happen): default language, no switching.
  const ui = INTERFACE_LANGUAGE;
  return {
    lang: DEFAULT_LANGUAGE,
    preferredLang: DEFAULT_LANGUAGE,
    ui,
    dir: INTERFACE_DIRECTION,
    locale: localeOf(ui),
    ogLocale: ogLocaleOf(ui),
    languageInfo: null,
    directionOf: (code) => directionOf(code, null),
    setLanguage: () => {},
    rememberLanguage: () => {},
    t: translatorFor(ui),
    languageName: (code, fallback) => nameOf(ui, code, fallback, null),
    formatNumber: (number) => formatNumber(number, ui),
  };
}
