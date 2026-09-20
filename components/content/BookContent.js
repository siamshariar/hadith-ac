import Link from "next/link";
import { useContext } from "react";
import { SettingsContext } from "../../contexts/SettingsContext";
import styles from "./Content.module.scss";

export default function BookContent({ book, chapters, bookId }) {
  const { theme } = useContext(SettingsContext);

  return (
    <div className={`${styles.wrapper} ${theme}`}>
      <div className={styles.content}>
        <div className={styles.title}>
          <h1 className={styles.title_text}>
            {book?.name_en || book?.title || book?.name_ar || `Book ${bookId}`}
          </h1>
          {book?.description && (
            <p className={styles.description}>{book.description}</p>
          )}
        </div>

        <div className={styles.chapters_list}>
          <h2>Chapters</h2>
          {chapters && chapters.length > 0 ? (
            <div className={styles.chapters_grid}>
              {chapters.map((chapter) => (
                <Link
                  key={chapter.id}
                  href={`/books/${bookId}/chapters/${chapter.id}`}
                  className={styles.chapter_card}
                >
                  <div className={styles.chapter_number}>
                    Chapter {chapter.chapter_no || chapter.id}
                  </div>
                  <div className={styles.chapter_title}>
                    {chapter.name_en || chapter.title || chapter.name_ar || 'Untitled'}
                  </div>
                  <div className={styles.chapter_count}>
                    {chapter.total_hadith || 0} hadiths
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p>No chapters found for this book.</p>
          )}
        </div>
      </div>
    </div>
  );
}