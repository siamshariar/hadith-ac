import { server } from "../../../lib/config";
import {
  getBooks,
  getChaptersByBook,
  getHadithsByChapter,
  getAllCategories,
  getAllCategoriesTree,
  getLocalBooks,
  getLocalChaptersByBook,
  getLocalHadithsByChapter,
  getTranslations,
  SUPPORTED_LANGUAGES,
} from "../../../lib/fetch";
import Meta from "../../../components/core/meta";
import Layout from "../../../components/layouts/LayoutSecondary";
import HadithCard from "../../../components/content/HadithListCard";
import styles from "../../../components/content/Content.module.scss";
import { useEffect, useState, useRef } from "react";

export default function BookHadiths({ book, chapters = [], bookId, categoryList, categoryTree }) {
  const bookTitle = book ? (book.name_en || book.name_ar || book.title) : `Book ${bookId}`;
  const [selectedHadith, setSelectedHadith] = useState(null);
  const [expandedChapters, setExpandedChapters] = useState({});
  const [hadithsByChapter, setHadithsByChapter] = useState({});
  const [loadingAll, setLoadingAll] = useState(false);
  const [loadProgress, setLoadProgress] = useState({ done: 0, total: 0 });
  const [prefetching, setPrefetching] = useState(false);
  const [prefetchProgress, setPrefetchProgress] = useState({ done: 0, total: 0 });
  const cancelPrefetchRef = useRef(false);

  async function loadChapters(ids = [], includeTranslations = false) {
    if (!ids || ids.length === 0) return;
    setLoadingAll(true);
    setLoadProgress({ done: 0, total: ids.length });

    for (let i = 0; i < ids.length; i++) {
      const cid = ids[i];
      try {
        // open the chapter in the UI
        setExpandedChapters((p) => ({ ...p, [cid]: true }));

        // show local hadiths immediately
        const local = getLocalHadithsByChapter(bookId, cid);
        if (local && local.length > 0) {
          setHadithsByChapter((prev) => ({ ...prev, [cid]: local }));
          if (!selectedHadith) setSelectedHadith(local[0]);
        }

        const h = await getHadithsByChapter(bookId, cid);
        setHadithsByChapter((prev) => ({ ...prev, [cid]: h || [] }));
        if (!selectedHadith && h && h.length > 0) setSelectedHadith(h[0]);
      } catch (err) {
        console.error(`Failed loading chapter ${cid}:`, err);
        setHadithsByChapter((prev) => ({ ...prev, [cid]: [] }));
      }

      setLoadProgress((p) => ({ ...p, done: p.done + 1 }));

      // small delay between chapter fetches to be gentle on the API
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 150));
    }

    setLoadingAll(false);

    if (includeTranslations) {
      // Prefetch translations for hadiths across these chapters
      setPrefetching(true);
      cancelPrefetchRef.current = false;

      const hadithList = ids.reduce((acc, cid) => {
        const list = hadithsByChapter[cid] || [];
        return acc.concat(list);
      }, []);

      setPrefetchProgress({ done: 0, total: hadithList.length });

      for (let i = 0; i < hadithList.length; i++) {
        if (cancelPrefetchRef.current) break;
        const had = hadithList[i];
        // Fetch missing translations sequentially
        const missing = SUPPORTED_LANGUAGES.filter((lang) => !had.translations || !had.translations[lang]);
        for (let j = 0; j < missing.length; j++) {
          const lang = missing[j];
          try {
            const text = await getTranslations(bookId, had.id, lang);
            if (text) {
              had.translations = { ...(had.translations || {}), [lang]: text };
            }
          } catch (err) {
            // ignore
          }
          // rate limit between language calls
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 80));
        }

        setPrefetchProgress((p) => ({ ...p, done: p.done + 1 }));
      }

      // push updates into state
      setHadithsByChapter((prev) => {
        const copy = { ...prev };
        ids.forEach((cid) => {
          copy[cid] = (copy[cid] || []).map((h) => ({ ...h, translations: h.translations }));
        });
        return copy;
      });

      setPrefetching(false);
      cancelPrefetchRef.current = false;
    }
  }

  return (
    <>
      <Meta
        title={`Hadiths from ${bookTitle}`}
        description={`Browse hadiths from ${bookTitle}. Hadith application in Vietnamese.`}
        url={`${server}/books/${bookId}/hadiths`}
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
            📖 {bookTitle}
          </h1>
          <p style={{
            fontSize: '16px',
            color: 'var(--txt12)',
            marginBottom: '20px'
          }}>
            Hadiths from this book
          </p>
        </div>

        <div className={styles.split_view}>
          <div className={styles.left_panel}>
            <div className={styles.chapters_list}>
              {chapters.map((chapter) => (
                <div key={chapter.id} className={styles.chapter}>
                  <div
                    className={styles.chapter_header}
                    onClick={() => {
                      const isOpen = !!expandedChapters[chapter.id];
                      setExpandedChapters((p) => ({ ...p, [chapter.id]: !isOpen }));
                      if (!isOpen && !hadithsByChapter[chapter.id]) {
                        // lazy load hadiths for this chapter — show local mock data first then update from API
                        const local = getLocalHadithsByChapter(bookId, chapter.id);
                        if (local && local.length > 0) {
                          setHadithsByChapter((prev) => ({ ...prev, [chapter.id]: local }));
                          if (!selectedHadith) setSelectedHadith(local[0]);
                        }
                        getHadithsByChapter(bookId, chapter.id).then((h) => {
                          setHadithsByChapter((prev) => ({ ...prev, [chapter.id]: h }));
                          if (!selectedHadith && h && h.length > 0) setSelectedHadith(h[0]);
                        });
                      }
                    }}
                  >
                    <h3 className={styles.chapter_title}>{chapter.title}</h3>
                    <span className={styles.expand_icon}>{expandedChapters[chapter.id] ? '▼' : '▶'}</span>
                  </div>
                  {expandedChapters[chapter.id] && (
                    <div className={styles.chapter_hadiths}>
                      {(hadithsByChapter[chapter.id] || []).length === 0 ? (
                        <div className={styles.loading}>Loading...</div>
                      ) : (
                        (hadithsByChapter[chapter.id] || []).map((hadith) => (
                          <div
                            key={hadith.id}
                            className={`${styles.hadith_list_item} ${selectedHadith && selectedHadith.id === hadith.id ? styles.selected : ''}`}
                            onClick={() => setSelectedHadith(hadith)}
                          >
                            <div className={styles.hadith_number}>{hadith.hadith_number || hadith.id}</div>
                            <div className={styles.hadith_preview}>{hadith.arabic_text ? hadith.arabic_text.substring(0, 50) + '...' : 'No text'}</div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <button
              onClick={() => {
                const ids = chapters.slice(0, 5).map((c) => c.id);
                loadChapters(ids, false);
              }}
              style={{ marginRight: 8 }}
            >
              Load chapters 1-5
            </button>
            <button
              onClick={() => {
                const ids = chapters.map((c) => c.id);
                loadChapters(ids, false);
              }}
            >
              Load all chapters
            </button>
            <button
              onClick={() => {
                const ids = chapters.slice(0, 5).map((c) => c.id);
                loadChapters(ids, true);
              }}
              style={{ marginLeft: 8 }}
              disabled={prefetching}
            >
              Load 1-5 (with translations)
            </button>
            <button
              onClick={() => {
                const ids = chapters.map((c) => c.id);
                loadChapters(ids, true);
              }}
              style={{ marginLeft: 8 }}
              disabled={prefetching}
            >
              Load all (with translations)
            </button>
            {prefetching && <button onClick={() => (cancelPrefetchRef.current = true)} style={{ marginLeft: 8 }}>Cancel</button>}
          </div>

          <div className={styles.right_panel}>
            {selectedHadith ? (
              <HadithCard hadith={selectedHadith} bookId={bookId} bookName={book?.name_en || book?.title} />
            ) : (
              <div className={styles.no_record}>Select a hadith to see details</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

BookHadiths.getLayout = function getLayout(page) {
  return <Layout linkPattern="books">{page}</Layout>;
};

export async function getStaticPaths() {
  // Use local books for static paths to avoid heavy API dependency
  const books = getLocalBooks() || [];

  const paths = books.map((book) => ({
    params: { bookId: book.id.toString() },
  }));

  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const { bookId } = params;
  const id = parseInt(bookId);
  const books = getLocalBooks() || [];
  const book = books.find(b => b.id === id) || null;
  const categoryListData = await getAllCategories();
  const categoryList = categoryListData?.categories || [];
  const categoryTree = await getAllCategoriesTree() || [];

  // For the book page, use local chapters for initial page
  let chapters = [];
  try {
    chapters = getLocalChaptersByBook(id) || [];
  } catch (error) {
    console.warn(`Failed to load local chapters for book ${id}:`, error);
  }

  return {
    props: {
      bookId: id,
      book: book ? JSON.parse(JSON.stringify(book)) : null,
      chapters: chapters ? chapters.map(c => JSON.parse(JSON.stringify(c))) : [],
      categoryList: categoryList ? categoryList.map(c => JSON.parse(JSON.stringify(c))) : [],
      categoryTree: categoryTree ? categoryTree.map(c => JSON.parse(JSON.stringify(c))) : [],
      selectedBookId: id,
      contentTitle: book ? (book.name_en || book.name_ar || book.title) : `Book ${id}`,
      backLink: "/books",
    },
    revalidate: 3600, // Revalidate every hour
  };
}
