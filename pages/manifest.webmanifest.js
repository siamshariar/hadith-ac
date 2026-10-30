import { INTERFACE_DIRECTION, INTERFACE_LANGUAGE } from "../lib/language";
import { site } from "../lib/sites";

// /manifest.webmanifest (linked from components/core/meta.js): the web app manifest with
// the deployment's name and interface language, so each country's site installs under
// its own name. Server-rendered: there is no static copy in public/.
export async function getServerSideProps({ res }) {
  const manifest = {
    name: site.siteName,
    short_name: site.siteName,
    lang: INTERFACE_LANGUAGE,
    dir: INTERFACE_DIRECTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#173A1D",
    icons: [{ src: "/img/favicon/android-chrome-192x192.png", sizes: "192x192", type: "image/png" }],
  };
  res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.end(JSON.stringify(manifest, null, 2));
  return { props: {} };
}

export default function Manifest() {
  return null;
}
