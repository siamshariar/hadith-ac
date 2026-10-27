import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
  DEFAULT_LANGUAGE,
  normalizeLanguage,
  readLanguageCookie,
  uiLanguage,
  writeLanguageCookie,
} from "../lib/language";
import { formatNumber, languageName, translate } from "../lib/i18n";

export const LocaleContext = createContext(null);

// `pageLang` is the content language a server-rendered page was fetched in
// (from `?lang=`, the preference cookie or the default) and `languageInfo` the
// API's description of it ({ code, name, nativeName, direction }). Static
// pages have neither and read the cookie after mounting.
export default function LocaleProvider({ pageLang, pageUi, languageInfo, children }) {
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
    // Interface language: from the server (saved preference) when given,
    // else from the preference read on the client.
    const ui = pageUi === "vi" || pageUi === "en" ? pageUi : uiLanguage(preferredLang);
    const info = languageInfo && languageInfo.code === lang ? languageInfo : null;
    const nameOf = (code) =>
      languageName(ui, code, info && code === info.code ? (ui === "vi" ? info.nativeName : info.name) : null);
    return {
      lang,
      preferredLang,
      ui,
      languageInfo: info,
      // Text direction of content in `code`, when known.
      directionOf: (code) => {
        if (info && code === info.code) return info.direction || "ltr";
        if (code === "ar") return "rtl";
        if (code === "en" || code === "vi") return "ltr";
        return "auto";
      },
      setLanguage,
      t: (key, vars) => translate(ui, key, vars),
      languageName: nameOf,
      formatNumber: (number) => formatNumber(number, ui),
    };
  }, [lang, preferredLang, pageUi, languageInfo, setLanguage]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (context) return context;
  // Outside the provider (should not happen): default language, no switching.
  const ui = uiLanguage(DEFAULT_LANGUAGE);
  return {
    lang: DEFAULT_LANGUAGE,
    preferredLang: DEFAULT_LANGUAGE,
    ui,
    languageInfo: null,
    directionOf: (code) => (code === "ar" ? "rtl" : "auto"),
    setLanguage: () => {},
    t: (key, vars) => translate(ui, key, vars),
    languageName: (code, fallback) => languageName(ui, code, fallback),
    formatNumber: (number) => formatNumber(number, ui),
  };
}
