import Link from "next/link";
import Container from "../core/container";
import Grades from "../hadith/Grades";
import { ArabicText, HadithTranslations } from "../hadith/HadithText";
import { useLocale } from "../../contexts/LocaleContext";
import { cleanText, hadithPath } from "../../lib/hadith";
import { referenceText } from "../../lib/citation";
import styles from "./banner.module.scss";

// Hadith.vn's brand band (header colours) with the search panel on it.
export function Hero({ children }) {
  const { t } = useLocale();
  return (
    <section className={styles.banner} aria-label={t("search")}>
      <Container>
        <div className={styles.panel}>{children}</div>
      </Container>
    </section>
  );
}

// The hadith of the day from /hadith/home (changes at 00:00 UTC).
export default function DailyHadith({ hadith }) {
  const { t } = useLocale();
  if (!hadith) return null;

  const href = hadithPath(hadith);

  return (
    <article className={styles.daily} aria-labelledby="daily-hadith">
      <div className={styles.top}>
        <h2 id="daily-hadith" className={styles.eyebrow}>
          {t("dailyHadith")}
        </h2>
        <Link href={href} className={styles.citation}>
          {referenceText(hadith, hadith.book, t)}
        </Link>
      </div>

      {hadith.title && (
        <p className={styles.title} dir="auto">
          {cleanText(hadith.title)}
        </p>
      )}

      <div className={styles.text}>
        <ArabicText text={hadith.arabic} clamped />
        <HadithTranslations hadith={hadith} clamped />
      </div>

      <div className={styles.footer}>
        <Grades grades={hadith.grades} gradeText={hadith.gradeText} />
        <Link href={href} className={styles.more}>
          {t("readMore")} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
