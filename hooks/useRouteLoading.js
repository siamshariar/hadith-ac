import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const pathOf = (url) => String(url || "").split(/[?#]/)[0];

// True while a navigation is in flight. With `samePage` (default) only
// navigations that stay on the current path count - pagination, filters,
// language changes - so a list can show skeletons while its next page loads.
export default function useRouteLoading({ samePage = true } = {}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const start = (url, { shallow } = {}) => {
      if (shallow) return;
      if (!samePage || pathOf(url) === pathOf(router.asPath)) setLoading(true);
    };
    const done = () => setLoading(false);

    router.events.on("routeChangeStart", start);
    router.events.on("routeChangeComplete", done);
    router.events.on("routeChangeError", done);
    return () => {
      router.events.off("routeChangeStart", start);
      router.events.off("routeChangeComplete", done);
      router.events.off("routeChangeError", done);
    };
  }, [router, samePage]);

  return loading;
}
