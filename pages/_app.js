import { useEffect } from "react";
import { useRouter } from "next/router";
import localFont from "next/font/local";
// import LayoutContextProvider from "../contexts/LayoutContext";
import SettingsContextProvider from "../contexts/SettingsContext";
import LocaleProvider from "../contexts/LocaleContext";
import RouteProgress from "../components/core/RouteProgress";
import * as gtag from "../lib/gtag";
import "react-loading-skeleton/dist/skeleton.css";
import "../styles/global.scss";

// Self-hosted (styles/fonts): no network at build time and no layout shift
// (next/font adjusts the fallback metrics). Both are SIL OFL 1.1 (OFL.txt next
// to the files), from github.com/google/fonts, subset with fontTools
// pyftsubset --layout-features='*' --flavor=woff2: Be Vietnam Pro to Latin,
// Latin Extended and Vietnamese; Amiri to Arabic (with presentation forms,
// e.g. ﷺ) and basic Latin.
// Be Vietnam Pro: designed for Vietnamese, full diacritics. Amiri: Naskh for
// hadith Arabic with complete harakat.
const uiFont = localFont({
  src: [
    { path: "../styles/fonts/be-vietnam-pro/BeVietnamPro-Regular.woff2", weight: "400", style: "normal" },
    { path: "../styles/fonts/be-vietnam-pro/BeVietnamPro-Medium.woff2", weight: "500", style: "normal" },
    { path: "../styles/fonts/be-vietnam-pro/BeVietnamPro-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../styles/fonts/be-vietnam-pro/BeVietnamPro-Bold.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  adjustFontFallback: "Arial",
});
const arabicFont = localFont({
  src: [
    { path: "../styles/fonts/amiri/Amiri-Regular.woff2", weight: "400", style: "normal" },
    { path: "../styles/fonts/amiri/Amiri-Bold.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

const App = ({ Component, pageProps }) => {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = (url) => {
      gtag.pageview(url);
    };
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events]);

  useEffect(() => {
    const preventSave = (e) => {
      if (
        e.key === "s" &&
        (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)
      ) {
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", preventSave);
    return () => document.removeEventListener("keydown", preventSave);

    // document.addEventListener('contextmenu', (e) => {
    //   e.preventDefault()
    // })
  }, []);

  const getLayout = Component.getLayout || ((page) => page);

  return (
    <LocaleProvider pageLang={pageProps.lang} pageUi={pageProps.uiLang} languageInfo={pageProps.languageInfo}>
      {/* On :root so MUI portals (menus, modals) get the fonts too. */}
      <style jsx global>{`
        :root {
          --font-ui-family: ${uiFont.style.fontFamily};
          --font-amiri-family: ${arabicFont.style.fontFamily};
        }
      `}</style>
      <SettingsContextProvider>
        <RouteProgress />
        {getLayout(<Component {...pageProps} />)}
      </SettingsContextProvider>
    </LocaleProvider>
  );

  // return (
  //   <LayoutContextProvider>
  //     {getLayout(<Component {...pageProps} />)}
  //   </LayoutContextProvider>
  // );
};

export default App;
