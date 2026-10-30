import { server } from "../lib/config";
import { DEFAULT_LANGUAGE } from "../lib/language";
import { getBook, getBooks, getCategories } from "../lib/api";
import { bookPath, categoryPath, chapterPath } from "../lib/hadith";

// /sitemap.xml, built from the API: the home page, the collections and every collection,
// every chapter (/books/{slug}/chapters/{n}), the categories and every category, and the
// sources and about pages, at the deployment's public URL (NEXT_PUBLIC_SITE_URL).
// Hadith pages (about 40,000) are not listed: crawlers reach them through the chapter
// pages, which link every hadith of the chapter, page by page.
// When the API fails the answer is a 503 with Retry-After, never a partial sitemap.

const CACHE = "public, max-age=600"; // the API's book and category lists change rarely

const escapeXml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]);

async function sitemapPaths(language = DEFAULT_LANGUAGE) {
  const [books, categories] = await Promise.all([getBooks(language), getCategories(language)]);
  const details = await Promise.all(books.map((book) => getBook(book.slug, language)));
  return [
    "/",
    "/books",
    ...details.flatMap((book) => [
      bookPath(book),
      ...(book.chapters || []).map((chapter) => chapterPath(book.slug, chapter.chapterNo)),
    ]),
    "/categories",
    ...categories.map((category) => categoryPath(category)),
    "/sources",
    "/about",
  ];
}

export async function getServerSideProps({ res }) {
  let paths;
  try {
    paths = await sitemapPaths();
  } catch (error) {
    console.error(`[sitemap] ${error.message}${error.url ? ` (${error.url})` : ""}`);
    res.statusCode = 503;
    res.setHeader("Retry-After", "600");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("The sitemap is unavailable: the hadith API did not answer. Try again later.\n");
    return { props: {} };
  }

  const urls = [...new Set(paths)].map((path) => `  <url><loc>${escapeXml(`${server}${path}`)}</loc></url>`);
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", CACHE);
  res.end(body);
  return { props: {} };
}

export default function Sitemap() {
  return null;
}
