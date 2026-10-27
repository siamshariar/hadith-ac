import Link from "next/link";
import { useLocale } from "../../contexts/LocaleContext";
import { bookPath } from "../../lib/hadith";
import styles from "./book-card.module.scss";

// One collection. With `showTranslation`, says how much of it exists in the
// reader's language (most collections only have English).
export default function BookCard({ book, index, showTranslation = false }) {
  const { t, lang, formatNumber, languageName } = useLocale();

  const counts = [`${formatNumber(book.totalHadith)} ${t("hadiths")}`];
  if (book.totalChapter > 1) counts.push(`${formatNumber(book.totalChapter)} ${t("chapters")}`);

  let translationNote = null;
  if (showTranslation && lang !== "ar" && book.totalTranslated != null) {
    translationNote =
      book.totalTranslated > 0
        ? t("translationAvailability", {
            count: formatNumber(book.totalTranslated),
            language: languageName(lang),
          })
        : t("noTranslationInBook", { language: languageName(lang) });
  }

  return (
    <Link href={bookPath(book)} className={styles.item}>
      <span className={styles.number}>{index}</span>
      <span className={styles.left}>
        <span className={styles.name}>{book.name}</span>
        <span className={styles.bottom}>{counts.join(" · ")}</span>
        {translationNote && (
          <span className={`${styles.translation} ${book.totalTranslated > 0 ? styles.hasTranslation : ""}`}>
            {translationNote}
          </span>
        )}
      </span>
      {book.nameArabic && (
        <span className={styles.right} dir="rtl" lang="ar">
          {book.nameArabic}
        </span>
      )}
    </Link>
  );
}
