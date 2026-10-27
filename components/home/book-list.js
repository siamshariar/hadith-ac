import BookCard from "./book-card";
import styles from "./book-list.module.scss";

export default function BookList({ books, showTranslation = false }) {
  if (!books || !books.length) return null;
  return (
    <ol className={styles.list}>
      {books.map((book, index) => (
        <li key={book.slug}>
          <BookCard book={book} index={index + 1} showTranslation={showTranslation} />
        </li>
      ))}
    </ol>
  );
}
