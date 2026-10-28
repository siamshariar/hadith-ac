import BookCard from "./book-card";
import styles from "./book-list.module.scss";

export default function BookList({ books, showTranslation = false, columns = 1 }) {
  if (!books || !books.length) return null;
  return (
    <ol className={`${styles.list} ${columns === 2 ? styles.twoColumns : ""}`}>
      {books.map((book, index) => (
        <li key={book.slug}>
          <BookCard book={book} index={index + 1} showTranslation={showTranslation} />
        </li>
      ))}
    </ol>
  );
}
