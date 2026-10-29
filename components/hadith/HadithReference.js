import { useState } from "react";
import Link from "next/link";
import Snackbar from "@mui/material/Snackbar";
import Share from "../core/share";
import FileCopyIcon from "../icons/FileCopy";
import LinkIcon from "../icons/Link";
import ShareIcon from "../icons/Share";
import { useLocale } from "../../contexts/LocaleContext";
import {
  buildCitation,
  displayedTranslations,
  inBookText,
  linkedLabel,
  permalink,
  referenceText,
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

// Copy citation, copy permalink, share.
function HadithActions({ hadith, book }) {
  const locale = useLocale();
  const { t } = locale;
  const [message, setMessage] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const url = permalink(hadith);
  const title = `${referenceText(hadith, book, t)} | Hadith.vn`;

  const copy = (text) => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard
      .writeText(text)
      .then(() => setMessage(t("copied")))
      .catch(() => {});
  };

  const share = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title, url }).catch(() => {});
    } else {
      setShareOpen(true);
    }
  };

  const closeShare = (open) => (event) => {
    if (event && event.type === "keydown" && (event.key === "Tab" || event.key === "Shift")) return;
    setShareOpen(open);
  };

  return (
    <div className={styles.actions}>
      <button type="button" className={styles.action} onClick={() => copy(buildCitation(hadith, book, locale))}>
        <FileCopyIcon />
        <span>{t("copyCitation")}</span>
      </button>
      <button type="button" className={styles.action} onClick={() => copy(url)}>
        <LinkIcon />
        <span>{t("copyLink")}</span>
      </button>
      <button type="button" className={styles.action} onClick={share}>
        <ShareIcon />
        <span>{t("share")}</span>
      </button>

      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        open={Boolean(message)}
        autoHideDuration={2500}
        onClose={() => setMessage(null)}
        message={message || ""}
      />
      {shareOpen && <Share open={shareOpen} closer={closeShare} url={url} title={title} />}
    </div>
  );
}

// The reference block under each hadith: citation, in-book reference
// (detail page), who translated the text shown and from which edition, and
// the grades.
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

      <HadithActions hadith={hadith} book={book} />
    </section>
  );
}
