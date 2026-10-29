import Link from "next/link";
import { useLocale } from "../../contexts/LocaleContext";
import { bookPath } from "../../lib/hadith";
import styles from "./book-card.module.scss";

// One collection. With `showTranslation`, says how much of it can be read in
// the reader's language (most collections only have English).
export default function BookCard({ book, index, showTranslation = false }) {
  const { t, lang, formatNumber, languageName } = useLocale();

  const counts = [`${formatNumber(book.totalHadith)} ${t("hadiths")}`];
  if (book.totalChapter > 1) counts.push(`${formatNumber(book.totalChapter)} ${t("chapters")}`);

  // Own translations and linked HadeethEnc translations are counted apart:
  // a book with only linked ones is not "translated".
  const notes = [];
  if (showTranslation && lang !== "ar" && book.totalTranslated != null) {
    const language = languageName(lang);
    if (book.totalTranslated > 0) {
      notes.push({
        key: "own",
        text: t("translationAvailability", { count: formatNumber(book.totalTranslated), language }),
        strong: true,
      });
    }
    if (book.totalLinkedTranslated > 0) {
      notes.push({
        key: "linked",
        text: t("bookLinkedTranslations", { count: formatNumber(book.totalLinkedTranslated), language }),
      });
    }
    if (!notes.length) notes.push({ key: "none", text: t("noTranslationInBook", { language }) });
  }

  return (
    <Link href={bookPath(book)} className={styles.item}>
      <span className={styles.top}>
        <span className={styles.number}>{index}</span>
        {book.nameArabic && (
          <span className={styles.arabic} dir="rtl" lang="ar">
            {book.nameArabic}
          </span>
        )}
      </span>
      <span className={styles.name}>{book.name}</span>
      <span className={styles.bottom}>{counts.join(" · ")}</span>
      {notes.map((note) => (
        <span key={note.key} className={`${styles.translation} ${note.strong ? styles.hasTranslation : ""}`}>
          {note.text}
        </span>
      ))}
    </Link>
  );
}
