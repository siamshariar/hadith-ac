import { useState } from "react";
import Link from "next/link";
import Skeleton from "react-loading-skeleton";
import { useLocale } from "../../contexts/LocaleContext";
import { citation, cleanText, hadithPath } from "../../lib/hadith";
import HadithOptions from "../content/HadithOptions";
import Grades from "./Grades";
import { ArabicText, HadithTranslations, needsClamp } from "./HadithText";
import styles from "./HadithCard.module.scss";

// One hadith in a list (chapter, category, search, bookmarks). The citation
// is the book plus `referenceNumber`, the number people cite.
export default function HadithCard({ hadith, book, context, isBookmarkPage, updateBookmarksData }) {
  const { t } = useLocale();
  const [expanded, setExpanded] = useState(false);
  const clampable = needsClamp(hadith);
  const clamped = clampable && !expanded;
  const href = hadithPath(hadith);

  return (
    <article className={styles.card} id={`hadith-${hadith.id}`}>
      <header className={styles.head}>
        <div className={styles.reference}>
          <Link href={href} className={styles.citation}>
            {citation(hadith, book) || `${t("hadith")} ${hadith.referenceNumber}`}
          </Link>
          {context && <span className={styles.context}>{context}</span>}
        </div>
        <div className={styles.options}>
          <HadithOptions
            hadith={hadith}
            book={book}
            isBookmarkPage={isBookmarkPage}
            updateBookmarksData={updateBookmarksData}
          />
        </div>
      </header>

      {hadith.title && (
        <h3 className={styles.title} dir="auto">
          <Link href={href}>{cleanText(hadith.title)}</Link>
        </h3>
      )}

      <div className={styles.body}>
        <ArabicText text={hadith.arabic} clamped={clamped} />
        <HadithTranslations hadith={hadith} clamped={clamped} />
      </div>

      <footer className={styles.foot}>
        <Grades grades={hadith.grades} gradeText={hadith.gradeText} />
        <div className={styles.actions}>
          {clampable && (
            <button
              type="button"
              className={styles.toggle}
              onClick={() => setExpanded((value) => !value)}
              aria-expanded={expanded}
            >
              {expanded ? t("showLess") : t("showMore")}
            </button>
          )}
          <Link href={href} className={styles.details}>
            {t("viewDetails")} <span aria-hidden="true">→</span>
          </Link>
        </div>
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
      <div className={styles.body}>
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
export function HadithList({ hadiths, loading, renderCard, skeletonCount = 4 }) {
  if (loading) {
    return (
      <div className={styles.list} aria-busy="true">
        <HadithCardSkeleton count={skeletonCount} />
      </div>
    );
  }
  return <div className={styles.list}>{hadiths.map((hadith) => renderCard(hadith))}</div>;
}
