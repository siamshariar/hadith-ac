import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import styles from "./RouteProgress.module.scss";

// Thin bar at the top of the viewport while the next page's data loads.
export default function RouteProgress() {
  const router = useRouter();
  const [active, setActive] = useState(false);

  useEffect(() => {
    let timer;
    const start = (url, { shallow } = {}) => {
      if (shallow) return;
      clearTimeout(timer);
      // Skip the bar for navigations that finish almost immediately.
      timer = setTimeout(() => setActive(true), 120);
    };
    const done = () => {
      clearTimeout(timer);
      setActive(false);
    };
    router.events.on("routeChangeStart", start);
    router.events.on("routeChangeComplete", done);
    router.events.on("routeChangeError", done);
    return () => {
      clearTimeout(timer);
      router.events.off("routeChangeStart", start);
      router.events.off("routeChangeComplete", done);
      router.events.off("routeChangeError", done);
    };
  }, [router]);

  return <div className={`${styles.bar} ${active ? styles.active : ""}`} aria-hidden="true" />;
}
