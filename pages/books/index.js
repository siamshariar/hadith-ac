import { server } from "../../lib/config";
import {
  getAllCategories,
  getAllCategoriesTree,
  getBooks,
  getChaptersByBook,
  getHadithsByChapter,
  getLocalBooks,
  getLocalChaptersByBook,
  getLocalHadithsByChapter,
  ensureSerializable,
} from "../../lib/fetch";
import { useEffect, useState } from 'react';
import Meta from "../../components/core/meta";
import Layout from "../../components/layouts/LayoutSecondary";
import BookContent from "../../components/content/BookContent";

export default function Books({ categoryList, categoryTree, books: initialBooks, selectedBookId, book: initialBook, hadithsByChapter: initialHadithsByChapter, chapters: initialChapters }) {
  const [books, setBooks] = useState(initialBooks || []);
  const [book, setBook] = useState(initialBook || null);
  const [chapters, setChapters] = useState(initialChapters || []);
  const [hadithsByChapter, setHadithsByChapter] = useState(initialHadithsByChapter || {});

  useEffect(() => {
    let mounted = true;
    async function fetchApi() {
      try {
        const apiBooksData = await getBooks();
        const apiBooks = apiBooksData?.books || [];
        if (mounted && apiBooks.length > 0) setBooks(apiBooks);
        if (selectedBookId) {
          const bookId = parseInt(selectedBookId);
          const apiBook = apiBooks.find(b => b.id === bookId) || null;
          if (mounted && apiBook) {
            setBook(apiBook);
            const apiChapters = await getChaptersByBook(bookId);
            setChapters(apiChapters || []);
            const newHadiths = {};
            for (const ch of apiChapters || []) {
              try {
                const h = await getHadithsByChapter(bookId, ch.id);
                newHadiths[ch.id] = h || [];
              } catch (err) {
                newHadiths[ch.id] = [];
              }
            }
            setHadithsByChapter(newHadiths);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch API updates for books page', err);
      }
    }
    const t = setTimeout(fetchApi, 100);
    return () => { mounted = false; clearTimeout(t); };
  }, [selectedBookId]);

  // If a book is selected, show its hadiths organized by chapters
  if (selectedBookId && book && Object.keys(hadithsByChapter).length > 0 && chapters.length > 0) {
    return (
      <>
        <Meta
          title={`${book ? book.name_en || book.title : 'Book'}`}
          description={`${book ? book.name_en || book.title : 'Book'}. Hadith application in Vietnamese.`}
          url={`${server}/books?book=${selectedBookId}`}
          image={`${server}/img/s_logo.png`}
          type="website"
        />

        <BookContent book={book} chapters={chapters} hadithsByChapter={hadithsByChapter} />
      </>
    );
  }

  // Default view: show welcome message
  return (
    <>
      <Meta
        title="Hadith Books"
        description="Browse hadith books and collections. Hadith application in Vietnamese."
        url={`${server}/books`}
        image={`${server}/img/s_logo.png`}
        type="website"
      />

      <div style={{ padding: '20px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: 'var(--txt11)',
            marginBottom: '10px'
          }}>
            📚 Hadith Books
          </h1>
          <p style={{
            fontSize: '16px',
            color: 'var(--txt12)',
            marginBottom: '20px'
          }}>
            Select a book from the sidebar to view its hadiths
          </p>
        </div>

        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          backgroundColor: 'var(--bg2)',
          borderRadius: '8px',
          margin: '20px 0'
        }}>
          <h2 style={{
            fontSize: '24px',
            color: 'var(--txt11)',
            marginBottom: '16px'
          }}>
            Welcome to Hadith Books
          </h2>
          <p style={{
            fontSize: '16px',
            color: 'var(--txt12)',
            lineHeight: '1.6',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Choose a book from the sidebar to explore its collection of hadiths.
            Each book contains authentic narrations from the Prophet Muhammad (ﷺ).
          </p>
        </div>
      </div>
    </>
  );
}

Books.getLayout = function getLayout(page) {
  const { selectedBookId, books } = page.props;
  return (
    <Layout
      linkPattern="books"
      books={books}
      selectedBookId={selectedBookId}
    >
      {page}
    </Layout>
  );
};

export async function getServerSideProps(context) {
  const { book: selectedBookId } = context.query;

  const categoryListData = await getAllCategories();
  const categoryList = categoryListData?.categories || [];
  const categoryTree = await getAllCategoriesTree() || [];

  // Fetch books from API
  const allBooksData = await getBooks();
  let allBooks = allBooksData?.books || [];

  let book = null;
  let hadithsByChapter = {};
  let chapters = [];

  // If a book is selected via query parameter, fetch its data
  if (selectedBookId) {
    const bookId = parseInt(selectedBookId);
    book = allBooks.find((b) => b.id === bookId) || null;
    if (book) {
      chapters = await getChaptersByBook(bookId) || [];
      // Get hadiths for each chapter
      for (const ch of chapters) {
        try {
          const h = await getHadithsByChapter(bookId, ch.id);
          hadithsByChapter[ch.id] = h || [];
        } catch (err) {
          hadithsByChapter[ch.id] = [];
        }
      }
    }
  }

  return {
    props: ensureSerializable({
      categoryList: categoryList,
      categoryTree: categoryTree,
      books: allBooks,
      selectedBookId: selectedBookId ? parseInt(selectedBookId) : null,
      book: book,
      hadithsByChapter: hadithsByChapter,
      chapters: chapters,
      contentTitle: "Hadith Books",
      backLink: "/",
    }),
  };
}
