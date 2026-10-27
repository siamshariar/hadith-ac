import { useLocale } from "../../contexts/LocaleContext";
import styles from "./hadith.module.scss";

// Grades exactly as the API gives them: one entry per grader the source names,
// plus HadeethEnc's `gradeText`. Nothing is inferred: Bukhari, Muslim and the
// forty-hadith books have no per-hadith grades, so nothing is rendered.
export default function Grades({ grades, gradeText, variant = "compact" }) {
  const { t } = useLocale();
  const list = Array.isArray(grades) ? grades.filter((grade) => grade && grade.grade) : [];
  if (!list.length && !gradeText) return null;

  if (variant === "full") {
    return (
      <section className={styles.gradesFull} aria-labelledby="hadith-grades">
        <h2 id="hadith-grades" className={styles.sectionTitle}>
          {t("grades")}
        </h2>
        {gradeText && <p className={styles.gradeText}>{gradeText}</p>}
        {list.length > 0 && (
          <ul className={styles.graderList}>
            {list.map((grade, index) => (
              <li key={`${grade.graderName}-${index}`}>
                <span className={styles.graderName}>{grade.graderName}</span>
                <bdi className={styles.graderGrade}>{grade.grade}</bdi>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  return (
    <ul className={styles.gradeChips} aria-label={t("grades")}>
      {gradeText && <li className={`${styles.chip} ${styles.chipPrimary}`}>{gradeText}</li>}
      {list.map((grade, index) => (
        <li key={`${grade.graderName}-${index}`} className={styles.chip}>
          <span className={styles.chipGrader}>{grade.graderName}:</span> <bdi>{grade.grade}</bdi>
        </li>
      ))}
    </ul>
  );
}
