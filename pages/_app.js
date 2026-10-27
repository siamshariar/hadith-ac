import { useEffect } from "react";
import { useRouter } from "next/router";
// import LayoutContextProvider from "../contexts/LayoutContext";
import SettingsContextProvider from "../contexts/SettingsContext";
import LocaleProvider from "../contexts/LocaleContext";
import RouteProgress from "../components/core/RouteProgress";
import * as gtag from "../lib/gtag";
import "react-loading-skeleton/dist/skeleton.css";
import "../styles/global.scss";

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
