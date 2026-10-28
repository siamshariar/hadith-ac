import Link from "next/link";
import { useLocale } from "../../contexts/LocaleContext";
import { cleanText, hadithPath } from "../../lib/hadith";
import styles from "./hadith.module.scss";

// Arabic is always present and always rendered right-to-left.
export function ArabicText({ text, clamped = false, large = false }) {
  if (!text) return null;
  return (
    <div
      className={`${styles.arabic} ${large ? styles.arabicLarge : ""} ${clamped ? styles.clampArabic : ""}`}
      dir="rtl"
      lang="ar"
    >
      {cleanText(text)}
    </div>
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
        {cleanText(translation.text)}
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
export function LinkedTranslation({ linked, clamped = false }) {
  const { t, languageName, directionOf } = useLocale();
  const code = linked.languageCode;
  const label = t("linkedTranslation", { language: languageName(code) });

  return (
    <div className={styles.linked}>
      <div className={styles.labelRow}>
        <span className={styles.linkedBadge}>{label}</span>
        {linked.author && (
          <span className={styles.author}>
            {t("translator")}: {linked.author}
          </span>
        )}
      </div>
      {/* Said before the text, so it is read as what it is. */}
      <p className={styles.linkedNote}>
        {t("linkedTranslationNote")}{" "}
        <Link href={hadithPath({ id: linked.hadithId })}>
          {t("linkedTranslationLink")} <span aria-hidden="true">→</span>
        </Link>
      </p>
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

// Cards, the detail page and the daily hadith all render translations here.
export function HadithTranslations({ hadith, clamped = false, showNote = false }) {
  const { t, languageName } = useLocale();
  const { linked, own } = shownTranslation(hadith);

  if (!linked) return <Translation translation={own} clamped={clamped} showNote={showNote} />;

  return (
    <div className={styles.translations}>
      <LinkedTranslation linked={linked} clamped={clamped} />
      {own && (
        <details className={styles.fallbackDetails}>
          <summary>{t("showFallbackTranslation", { language: languageName(own.languageCode) })}</summary>
          <Translation translation={own} />
        </details>
      )}
    </div>
  );
}

// Long texts are clamped in lists (full text stays in the HTML).
export const ARABIC_CLAMP_LENGTH = 420;
export const TRANSLATION_CLAMP_LENGTH = 520;

export function needsClamp(hadith) {
  const arabic = (hadith && hadith.arabic) || "";
  const { linked, own } = shownTranslation(hadith);
  const shown = (linked || own || {}).text || "";
  return arabic.length > ARABIC_CLAMP_LENGTH || shown.length > TRANSLATION_CLAMP_LENGTH;
}
