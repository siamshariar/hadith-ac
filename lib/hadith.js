// Routes and display helpers for API hadith objects.

const segment = (value) => encodeURIComponent(String(value));

// Citations use the API's `referenceNumber`, the number people cite.
export const hadithPath = (hadith) => `/hadiths/${segment(hadith.id)}`;
export const bookPath = (book) => `/books/${segment(book.slug || book.code || book.id)}`;
export const chapterPath = (bookSlug, chapterNo) => `/books/${segment(bookSlug)}/chapters/${segment(chapterNo)}`;
export const bookHadithPath = (bookSlug, referenceNumber) =>
  `/books/${segment(bookSlug)}/hadiths/${segment(referenceNumber)}`;
export const categoryPath = (category) => `/categories/${segment(category.slug || category.id)}`;
export const categoryHadithsPath = (category) => `${categoryPath(category)}/hadiths`;

export const UNASSIGNED_CHAPTER = -1;
// HadeethEnc has a single technical chapter; its real structure is the category tree.
export const isCategoryBook = (book) => Boolean(book) && (book.source === "hadeethenc" || book.code === "hadeethenc");

// "HadeethEnc - Encyclopedia of Translated Prophetic Hadiths" is too long for citations.
export function shortBookName(book) {
  if (!book) return "";
  if (isCategoryBook(book)) return "HadeethEnc";
  return book.name || book.nameEnglish || "";
}

export function citation(hadith, book) {
  const name = shortBookName(book);
  return [name, hadith.referenceNumber].filter(Boolean).join(" ");
}

// Source text uses \r\n in places (e.g. HadeethEnc benefits).
export const cleanText = (text) => String(text || "").replace(/\r\n?/g, "\n").trim();

export function booksBySlug(books) {
  const map = {};
  (books || []).forEach((book) => {
    map[book.slug] = book;
  });
  return map;
}

// Minimal, serialisable reference stored for bookmarks, pins and last read.
// Version 2 = ids of the quran-api hadith endpoints. Entries without it come
// from the retired API, whose ids point to different hadiths.
export const STORAGE_VERSION = 2;

export function storedHadithRef(hadith, book) {
  return {
    v: STORAGE_VERSION,
    id: hadith.id,
    book_slug: hadith.bookSlug || (book && book.slug) || null,
    book_name: shortBookName(book) || null,
    hadith_number: hadith.referenceNumber || null,
    chapter_no: hadith.chapterNo ?? null,
    title: hadith.title || null,
  };
}

export const isCurrentStoredRef = (entry) => Boolean(entry) && entry.v === STORAGE_VERSION;
