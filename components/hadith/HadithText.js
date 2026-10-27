import { useLocale } from "../../contexts/LocaleContext";
import { cleanText } from "../../lib/hadith";
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

// Long texts are clamped in lists (full text stays in the HTML).
export const ARABIC_CLAMP_LENGTH = 420;
export const TRANSLATION_CLAMP_LENGTH = 520;

export function needsClamp(hadith) {
  const arabic = (hadith && hadith.arabic) || "";
  const translation = (hadith && hadith.translation && hadith.translation.text) || "";
  return arabic.length > ARABIC_CLAMP_LENGTH || translation.length > TRANSLATION_CLAMP_LENGTH;
}
