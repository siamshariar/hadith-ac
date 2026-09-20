import { useState, useContext } from "react";
import Link from "next/link";
import { getHadithsByChapter } from "../../lib/fetch";
import { SettingsContext } from "../../contexts/SettingsContext";
import HadithCard from "./HadithListCard";
import styles from "./Content.module.scss";

export default function BookContent({ book, chapters, bookId }) {
  const [expandedChapters, setExpandedChapters] = useState({});
  const [chapterHadiths, setChapterHadiths] = useState({});
  const [loadingChapters, setLoadingChapters] = useState({});
  const { theme } = useContext(SettingsContext);

  const bookTitle = book ? (book.name_en || book.name_ar || book.title) : `Book ${bookId}`;

  // Get current page URL for pinning context
  const getCurrentPageUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.pathname + window.location.search;
    }
    return '';
  };

  const toggleChapter = async (chapter) => {
    const chapterId = chapter.id;
    const chapterNo = chapter.chapter_no || chapterId;
    
    const newExpanded = { ...expandedChapters };
    newExpanded[chapterId] = !newExpanded[chapterId];
    setExpandedChapters(newExpanded);

    // If expanding and we don't have hadiths yet, fetch them
    if (newExpanded[chapterId] && !chapterHadiths[chapterId]) {
      setLoadingChapters(prev => ({ ...prev, [chapterId]: true }));
      try {
        // Use the unique chapter.id when available (API chapter endpoints expect the chapter id)
        const hadiths = await getHadithsByChapter(bookId, chapterId);
        // If nothing returned, try with chapter_no as a fallback (some APIs use chapter_no)
        if ((!hadiths || hadiths.length === 0) && chapterNo && chapterNo !== chapterId) {
          const fallback = await getHadithsByChapter(bookId, chapterNo);
          if (fallback && fallback.length > 0) {
            setChapterHadiths(prev => ({ ...prev, [chapterId]: fallback || [] }));
            setLoadingChapters(prev => ({ ...prev, [chapterId]: false }));
            return;
          }
        }

        setChapterHadiths(prev => ({
          ...prev,
          [chapterId]: hadiths || []
        }));
      } catch (error) {
        console.warn(`Failed to fetch hadiths for chapter ${chapterId}:`, error);
        setChapterHadiths(prev => ({
          ...prev,
          [chapterId]: []
        }));
      } finally {
        setLoadingChapters(prev => ({ ...prev, [chapterId]: false }));
      }
    }
  };

  return (
    <div className={`${styles.wrapper} ${theme}`}>
      <div className={styles.content}>
        <div className={styles.title}>
          <h1 className={styles.title_text}>{bookTitle}</h1>
        </div>

        <div className={styles.chapters}>
          {Array.isArray(chapters) && chapters.length > 0 ? (
            chapters.map((chapter, index) => (
              <div key={chapter.id || index} className={styles.chapter}>
                <div
                  className={styles.chapter_header}
                  onClick={() => toggleChapter(chapter)}
                >
                  <h2 className={styles.chapter_title}>
                    {chapter.name_en || chapter.name_ar || chapter.title || `Chapter ${chapter.id || index + 1}`}
                  </h2>
                  <span className={styles.expand_icon}>
                    {expandedChapters[chapter.id] ? '▼' : '▶'}
                  </span>
                </div>

                {expandedChapters[chapter.id] && (
                  <div className={styles.chapter_hadiths}>
                    {loadingChapters[chapter.id] ? (
                      <p className={styles.loading}>Loading hadiths...</p>
                    ) : chapterHadiths[chapter.id] ? (
                      Array.isArray(chapterHadiths[chapter.id]) && chapterHadiths[chapter.id].length > 0 ? (
                        chapterHadiths[chapter.id].map((hadith, hadithIndex) => (
                          <HadithCard 
                            key={hadithIndex} 
                            hadith={hadith} 
                            bookId={bookId}
                            bookName={bookTitle}
                            chapterName={chapter.name_en || chapter.name_ar || chapter.title || `Chapter ${chapter.id}`}
                            currentPageUrl={getCurrentPageUrl()}
                            chapterId={chapter.id}
                          />
                        ))
                      ) : (
                        <p className={styles.no_hadiths}>No hadiths found in this chapter.</p>
                      )
                    ) : null}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className={styles.no_chapters}>
              <p>No chapters found for this book.</p>
              <p>Please check if the API server is running and the book has chapters.</p>
            </div>
          )}
        </div>

        <div className={styles.print_footer}>
          <span>Vietnamese Hassan</span>
          <span>www.quran.vn</span>
        </div>
      </div>
    </div>
  );
}