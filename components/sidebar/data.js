import { getBook, getBooks } from "../../lib/api";

// Server side (getServerSideProps): the books sidebar's data as a page prop
// (`sidebarData`), so the desktop sidebar comes with the page instead of
// after hydration and two requests in a row. Only the fields the sidebar
// shows; getBooks / getBook are memoised in lib/api, so pages that already
// fetched them pay nothing. `book` is a slug or an already fetched book.
const slimBook = ({ slug, code, source, name, nameArabic, totalHadith }) => ({
  slug,
  code,
  source,
  name,
  nameArabic: nameArabic || null,
  totalHadith,
});

const slimChapter = ({ chapterNo, name, totalHadith }) => ({ chapterNo, name, totalHadith });

export async function sidebarBooksData(lang, { book = null, books = null } = {}) {
  const [list, current] = await Promise.all([
    books || getBooks(lang),
    typeof book === "string" ? getBook(book, lang).catch(() => null) : book,
  ]);
  const chapters = {};
  if (current && Array.isArray(current.chapters)) chapters[current.slug] = current.chapters.map(slimChapter);
  return { books: (list || []).map(slimBook), chapters };
}
