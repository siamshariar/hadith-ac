import { useContext } from "react";
import { SettingsContext } from "../../contexts/SettingsContext";
import Link from "next/link";
import styles from "./book-card.module.scss";

export default function BookCard({ book, linkToBooksPage = false }) {
  const { verseMode } = useContext(SettingsContext);

  // Link to book page to show chapters
  const href = linkToBooksPage ? "/books" : `/books/${book.id}`;

  return (
    <div className={styles.item}>
      <Link href={href} className={styles.wrapper}>
        {/* ...existing code... */}
      </Link>
      <span className={styles.number}>{book.id}</span>
      <div className={styles.left}>
        <Link href={href} className={styles.name}>
          {book.name_en || book.name_ar || book.title}
        </Link>
        {/* <div className={styles.bottom}>{book.meaning}</div> */}
      </div>
      {/* <div className={styles.right}>{book.nameArabic}</div> */}
    </div>
  );
}