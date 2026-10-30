import { server } from "../lib/config";

// /robots.txt, for the deployment's public URL (NEXT_PUBLIC_SITE_URL, lib/config.js).
// Search results and the reader's own pages (bookmarks, settings) are left out;
// everything else may be crawled, from the sitemap.
export async function getServerSideProps({ res }) {
  const body = [
    "User-agent: *",
    "Disallow: /search",
    "Disallow: /bookmarks",
    "Disallow: /settings",
    "",
    `Sitemap: ${server}/sitemap.xml`,
    "",
  ].join("\n");
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.end(body);
  return { props: {} };
}

export default function Robots() {
  return null;
}
