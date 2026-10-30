import Link from "next/link";
import { useLocale } from "../../contexts/LocaleContext";
import { cleanText, hadithPath } from "../../lib/hadith";
import { Highlighted } from "./Highlight";
import styles from "./hadith.module.scss";

// Arabic is always present and always rendered right-to-left.
export function ArabicText({ text, clamped = false }) {
  if (!text) return null;
  return (
    <div className={`${styles.arabic} ${clamped ? styles.clampArabic : ""}`} dir="rtl" lang="ar">
      <Highlighted text={cleanText(text)} field="arabic" />
    </div>
  );
}

// English translations open with the narrator ("Narrated 'Umar bin
// Al-Khattab:"); like sunnah.com, that line is set apart in bold. Only the
// layout changes: the words are the source's.
const NARRATOR = /^(Narrated\s[^:\n]{1,160}):\s*/;

function TranslationText({ text, code }) {
  const clean = cleanText(text);
  const match = code === "en" ? clean.match(NARRATOR) : null;
  if (!match) return <Highlighted text={clean} field={code} />;
  return (
    <>
      <strong className={styles.narrator}>
        <Highlighted text={`${match[1]}:`} field={code} />
      </strong>
      <Highlighted text={clean.slice(match[0].length)} field={code} />
    </>
  );
}

// A translation as returned by the API: { languageCode, text, author, isFallback }.
// - isFallback: the English text, labelled so it never passes for the reader's language.
// - null: no translation at all; say so, the Arabic above stands alone.
export function Translation({ translation, clamped = false, showNote = false }) {
  const { t, lang, languageName, directionOf } = useLocale();

  if (!translation || !translation.text) {
    return (
      <p className={styles.missing} role="note">
        {t("noTranslation")}
      </p>
    );
  }

  const code = translation.languageCode;
  const isFallback = Boolean(translation.isFallback);

  return (
    <div className={styles.translation}>
      <div className={styles.labelRow}>
        {isFallback ? (
          <span className={styles.fallbackBadge}>
            {code === "en" ? t("fallbackTranslation") : t("translationIn", { language: languageName(code) })}
          </span>
        ) : (
          <span className={styles.label}>{t("translationIn", { language: languageName(code) })}</span>
        )}
        {translation.author && (
          <span className={styles.author}>
            {t("translator")}: {translation.author}
          </span>
        )}
      </div>
      {isFallback && showNote && (
        <p className={styles.fallbackNote}>{t("fallbackNote", { language: languageName(lang) })}</p>
      )}
      <div
        className={`${styles.translationText} ${clamped ? styles.clampTranslation : ""}`}
        lang={code}
        dir={directionOf(code)}
      >
        <TranslationText text={translation.text} code={code} />
      </div>
    </div>
  );
}

// What a reader sees: the hadith's own translation in their language; else
// the linked HadeethEnc translation (with the English fallback kept aside);
// else the English fallback or nothing.
export function shownTranslation(hadith) {
  const own = hadith && hadith.translation && hadith.translation.text ? hadith.translation : null;
  const linked = hadith && hadith.linkedTranslation && hadith.linkedTranslation.text ? hadith.linkedTranslation : null;
  if (own && !own.isFallback) return { linked: null, own };
  if (linked) return { linked, own };
  return { linked: null, own };
}

// HadeethEnc's translation of wording that appears verbatim in this hadith
// (API `linkedTranslation`). It is a different text from the hadith's own
// translation, usually shorter and without the chain of narrators, so it has
// its own block, label and note, and is never merged with anything else.
// `compact` (lists): the label and a link only; the list says once what the
// label means (LinkedTranslationNote).
export function LinkedTranslation({ linked, clamped = false, compact = false }) {
  const { t, languageName, directionOf } = useLocale();
  const code = linked.languageCode;
  const label = t("linkedTranslation", { language: languageName(code) });
  const source = hadithPath({ id: linked.hadithId });

  return (
    <div className={styles.linked}>
      <div className={styles.labelRow}>
        <span className={styles.linkedBadge}>{label}</span>
        {compact ? (
          <Link href={source} className={styles.linkedLink}>
            {t("linkedTranslationLink")} <span aria-hidden="true">→</span>
          </Link>
        ) : (
          <>
            {linked.author && (
              <span className={styles.author}>
                {t("translator")}: {linked.author}
              </span>
            )}
            {linked.edition && linked.edition.code && (
              <span className={styles.author}>
                {t("edition")} {linked.edition.code}
                {linked.edition.sourceUrl && (
                  <>
                    {" · "}
                    <a href={linked.edition.sourceUrl} target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>
                      {t("sourceLink")}
                    </a>
                  </>
                )}
              </span>
            )}
          </>
        )}
      </div>
      {/* Said before the text, so it is read as what it is. */}
      {!compact && (
        <p className={styles.linkedNote}>
          {t("linkedTranslationNote")}{" "}
          <Link href={source}>
            {t("linkedTranslationLink")} <span aria-hidden="true">→</span>
          </Link>
        </p>
      )}
      <div
        className={`${styles.translationText} ${clamped ? styles.clampTranslation : ""}`}
        lang={code}
        dir={directionOf(code)}
      >
        {cleanText(linked.text)}
      </div>
    </div>
  );
}

// Said once above a list whose cards show linked translations.
export function LinkedTranslationNote({ hadiths }) {
  const { t, languageName } = useLocale();
  const linked = (hadiths || []).map((hadith) => shownTranslation(hadith).linked).find(Boolean);
  if (!linked) return null;
  const language = languageName(linked.languageCode);
  return (
    <p className={styles.linkedListNote} role="note">
      {t("linkedListNote", { label: t("linkedTranslation", { language }), language })}
    </p>
  );
}

// Cards, the detail page and the daily hadith all render translations here.
// `compact`: the short linked-translation label of the cards.
export function HadithTranslations({ hadith, clamped = false, showNote = false, compact = false }) {
  const { t, languageName } = useLocale();
  const { linked, own } = shownTranslation(hadith);

  if (!linked) return <Translation translation={own} clamped={clamped} showNote={showNote} />;

  return (
    <div className={styles.translations}>
      <LinkedTranslation linked={linked} clamped={clamped} compact={compact} />
      {own && (
        <details className={styles.fallbackDetails}>
          <summary>{t("showFallbackTranslation", { language: languageName(own.languageCode) })}</summary>
          <Translation translation={own} />
        </details>
      )}
    </div>
  );
}
