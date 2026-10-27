import Link from "next/link";
import Container from "../core/container";
import Grades from "../hadith/Grades";
import { ArabicText, Translation } from "../hadith/HadithText";
import { useLocale } from "../../contexts/LocaleContext";
import { citation, cleanText, hadithPath } from "../../lib/hadith";
import styles from "./banner.module.scss";

// The hadith of the day from /hadith/home (changes at 00:00 UTC).
export default function Banner({ hadith }) {
  const { t } = useLocale();
  if (!hadith) return null;

  const href = hadithPath(hadith);

  return (
    <section className={styles.banner} aria-labelledby="daily-hadith">
      <Container>
        <article className={styles.inner}>
          <div className={styles.top}>
            <h2 id="daily-hadith" className={styles.eyebrow}>
              {t("dailyHadith")}
            </h2>
            <Link href={href} className={styles.citation}>
              {citation(hadith, hadith.book)}
            </Link>
          </div>

          {hadith.title && (
            <p className={styles.title} dir="auto">
              {cleanText(hadith.title)}
            </p>
          )}

          <div className={styles.text}>
            <ArabicText text={hadith.arabic} clamped />
            <Translation translation={hadith.translation} clamped />
          </div>

          <div className={styles.footer}>
            <Grades grades={hadith.grades} gradeText={hadith.gradeText} />
            <Link href={href} className={styles.more}>
              {t("readMore")} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </article>
      </Container>
    </section>
  );
}
