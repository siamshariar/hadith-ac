import { useEffect } from "react";
import { useRouter } from "next/router";
// import LayoutContextProvider from "../contexts/LayoutContext";
import SettingsContextProvider from "../contexts/SettingsContext";
import * as gtag from "../lib/gtag";
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
    document.addEventListener("keydown", (e) => {
      if (
        e.key === "s" &&
        (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)
      ) {
        e.preventDefault();
      }
    });

    // document.addEventListener('contextmenu', (e) => {
    //   e.preventDefault()
    // })
  }, []);

  const getLayout = Component.getLayout || ((page) => page);

  return (
    <SettingsContextProvider>
      {getLayout(<Component {...pageProps} />)}
    </SettingsContextProvider>
  );

  // return (
  //   <LayoutContextProvider>
  //     {getLayout(<Component {...pageProps} />)}
  //   </LayoutContextProvider>
  // );
};

export default App;
