import Link from "next/link";
import FeedbackIcon from "../icons/Feedback";
import { useLocale } from "../../contexts/LocaleContext";
import {
  displayedTranslations,
  inBookText,
  linkedLabel,
  referenceText,
  reportErrorHref,
  translationLabel,
} from "../../lib/citation";
import { hadithPath, isCategoryBook } from "../../lib/hadith";
import styles from "./HadithReference.module.scss";

// Grades exactly as the API gives them: one row per named grader, plus
// HadeethEnc's gradeText. Nothing when the source gives none (Bukhari, Muslim,
// the forty-hadith books).
export function GradesTable({ grades, gradeText }) {
  const { t } = useLocale();
  const list = Array.isArray(grades) ? grades.filter((grade) => grade && grade.grade) : [];
  if (!list.length && !gradeText) return null;

  return (
    <div className={styles.grades}>
      {gradeText && (
        <p className={styles.gradeText}>
          <span className={styles.term}>{t("grades")}:</span> <strong>{gradeText}</strong>
        </p>
      )}
      {list.length > 0 && (
        <table className={styles.gradeTable}>
          <caption className="visually_hidden">{t("grades")}</caption>
          <thead>
            <tr>
              <th scope="col">{t("grader")}</th>
              <th scope="col">{t("grade")}</th>
            </tr>
          </thead>
          <tbody>
            {list.map((grade, index) => (
              <tr key={`${grade.graderName}-${index}`}>
                <td>{grade.graderName}</td>
                <td>
                  <bdi>{grade.grade}</bdi>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// The reference block under the hadith on its page, as sunnah.com has it:
// citation, in-book reference, who translated the text shown and from which
// edition, the grades, and "report an error" (an e-mail with the citation
// and permalink filled in). Copy and share are in the icon row at the top.
export default function HadithReference({ hadith, book }) {
  const { t, languageName } = useLocale();
  const { own, linked } = displayedTranslations(hadith);
  // HadeethEnc has one technical chapter ("All hadiths"): no meaningful in-book reference.
  const inBook = isCategoryBook(book) ? null : inBookText(hadith.inBookReference, t);

  return (
    <section className={styles.reference} aria-label={t("refLabel")}>
      <dl className={styles.rows}>
        <div className={styles.row}>
          <dt className={styles.term}>{t("refLabel")}</dt>
          <dd>{referenceText(hadith, book, t)}</dd>
        </div>
        {inBook && (
          <div className={styles.row}>
            <dt className={styles.term}>{t("inBookReference")}</dt>
            <dd>{inBook}</dd>
          </div>
        )}
        {linked && (
          <div className={styles.row}>
            <dt className={styles.term}>{linkedLabel(linked, t, languageName)}</dt>
            <dd>
              <Link href={hadithPath({ id: linked.hadithId })}>{linked.author || "HadeethEnc.com"}</Link>
              {linked.edition && linked.edition.code && ` · ${t("edition")} ${linked.edition.code}`}
              {linked.edition && linked.edition.sourceUrl && (
                <>
                  {" · "}
                  <a href={linked.edition.sourceUrl} target="_blank" rel="noopener noreferrer">
                    {t("sourceLink")}
                    <span className="visually_hidden"> ({linked.edition.code})</span>
                  </a>
                </>
              )}
            </dd>
          </div>
        )}
        {own && (
          <div className={styles.row}>
            <dt className={styles.term}>{translationLabel(own, t, languageName)}</dt>
            <dd>
              {[own.author, own.edition && own.edition.code ? `${t("edition")} ${own.edition.code}` : null]
                .filter(Boolean)
                .join(" · ") || "-"}
              {own.edition && own.edition.sourceUrl && (
                <>
                  {" · "}
                  <a href={own.edition.sourceUrl} target="_blank" rel="noopener noreferrer">
                    {t("sourceLink")}
                    <span className="visually_hidden"> ({own.edition.code})</span>
                  </a>
                </>
              )}
            </dd>
          </div>
        )}
      </dl>

      <GradesTable grades={hadith.grades} gradeText={hadith.gradeText} />

      <p className={styles.report}>
        <a href={reportErrorHref(hadith, book, t)} className={styles.reportLink}>
          <FeedbackIcon />
          {t("reportError")}
        </a>
      </p>
    </section>
  );
}
