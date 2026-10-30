import Link from "next/link";
import Skeleton from "react-loading-skeleton";
import { useLocale } from "../../contexts/LocaleContext";
import {
  UNASSIGNED_CHAPTER,
  bookPath,
  chapterPath,
  citablePath,
  cleanText,
  isCategoryBook,
  shortBookName,
} from "../../lib/hadith";
import { inBookText, referenceText } from "../../lib/citation";
import HadithOptions from "../content/HadithOptions";
import { GradeBadge } from "./Grades";
import { ArabicText, HadithTranslations, LinkedTranslationNote, shownTranslation } from "./HadithText";
import styles from "./HadithCard.module.scss";

// Book › chapter, for lists that mix chapters (search results).
function CardContext({ hadith, book }) {
  const { t } = useLocale();
  if (!book) return null;
  const chapterNo = hadith.chapterNo;
  const showChapter = chapterNo != null && !isCategoryBook(book);
  return (
    <p className={styles.context}>
      <Link href={bookPath(book)}>{shortBookName(book)}</Link>
      {showChapter && (
        <>
          <span className={styles.contextSep} aria-hidden="true">
            ›
          </span>
          <Link href={chapterPath(book.slug, chapterNo)}>
            {chapterNo === UNASSIGNED_CHAPTER ? t("unassignedChapter") : `${t("chapter")} ${chapterNo}`}
          </Link>
        </>
      )}
    </p>
  );
}

// One hadith in a list (chapter, category, search, bookmarks), in full, as
// sunnah.com and HadeethEnc list them. The header is the compact reference:
// the citation (book plus `referenceNumber`, the number people cite), the
// in-book reference when the list knows it, and the first grade; the full
// grade table is on the detail page.
// - showContext: book › chapter above the citation (search results);
// - inBookReference: { chapterNo, position } when the API item has none
//   (the chapter page knows each hadith's position).
export default function HadithCard({ hadith, book, showContext = false, inBookReference, isBookmarkPage, updateBookmarksData }) {
  const { t } = useLocale();
  const href = citablePath(hadith, book);
  const inBook = isCategoryBook(book) ? null : inBookText(hadith.inBookReference || inBookReference, t);
  const { linked, own } = shownTranslation(hadith);
  // Without any translation the Arabic stays, even when the reader hides it.
  const arabicOnly = !linked && !own;

  return (
    <article className={styles.card} id={`hadith-${hadith.id}`}>
      <header className={styles.head}>
        {showContext && <CardContext hadith={hadith} book={book} />}
        <div className={styles.refLine}>
          <Link href={href} className={styles.citation}>
            {referenceText(hadith, book, t)}
          </Link>
          {inBook && <span className={styles.inBook}>{inBook}</span>}
          <GradeBadge grades={hadith.grades} gradeText={hadith.gradeText} />
        </div>
      </header>

      {hadith.title && (
        <h3 className={styles.title} dir="auto">
          <Link href={href}>{cleanText(hadith.title)}</Link>
        </h3>
      )}

      {/* Arabic and translation side by side when the card is wide enough
          (container query), stacked otherwise; the reader settings choose
          which comes first and can hide the Arabic. */}
      <div className={styles.texts}>
        <div className={`${styles.arabicCol} ${arabicOnly ? styles.arabicOnly : ""}`}>
          <ArabicText text={hadith.arabic} />
        </div>
        <div className={styles.translationCol}>
          <HadithTranslations hadith={hadith} compact />
        </div>
      </div>

      <footer className={styles.foot}>
        <HadithOptions
          hadith={hadith}
          book={book}
          isBookmarkPage={isBookmarkPage}
          updateBookmarksData={updateBookmarksData}
          showDetails
        />
        <Link href={href} className={styles.details}>
          {t("viewDetails")}
          <span className={styles.detailsArrow} aria-hidden="true">
            {" "}
            →
          </span>
        </Link>
      </footer>
    </article>
  );
}

export function HadithCardSkeleton({ count = 3 }) {
  return Array.from({ length: count }, (_, index) => (
    <div className={styles.card} key={index} aria-hidden="true">
      <div className={styles.head}>
        <Skeleton width={160} height={18} />
      </div>
      <div className={styles.texts}>
        <div className={styles.skeletonArabic}>
          <Skeleton count={2} height={26} />
          <Skeleton width="60%" height={26} />
        </div>
        <div>
          <Skeleton width={140} height={12} />
          <Skeleton count={2} height={16} />
          <Skeleton width="75%" height={16} />
        </div>
      </div>
    </div>
  ));
}

// A list of cards that switches to skeletons while the next page loads.
// When cards show HadeethEnc's linked translations, what that label means is
// said once, above the list (LinkedTranslationNote).
export function HadithList({ hadiths, loading, renderCard, skeletonCount = 4 }) {
  if (loading) {
    return (
      <div className={styles.list} aria-busy="true">
        <HadithCardSkeleton count={skeletonCount} />
      </div>
    );
  }
  return (
    <>
      <LinkedTranslationNote hadiths={hadiths} />
      <div className={styles.list}>{hadiths.map((hadith, index) => renderCard(hadith, index))}</div>
    </>
  );
}
