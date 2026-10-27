import { useContext, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { PinContext } from "../../contexts/PinContext";
import { useLocale } from "../../contexts/LocaleContext";
import {
  UNASSIGNED_CHAPTER,
  bookPath,
  categoryPath,
  chapterPath,
  citation,
  cleanText,
  isCategoryBook,
  storedHadithRef,
} from "../../lib/hadith";
import HadithOptions from "../content/HadithOptions";
import Grades from "./Grades";
import { ArabicText, Translation } from "./HadithText";
import styles from "./HadithDetail.module.scss";

// Switches this hadith's language with ?lang= (shareable, does not change the
// saved preference). Options come from the hadith's `availableLanguages`.
function LanguageSwitch({ available, languages }) {
  const router = useRouter();
  const { t, lang } = useLocale();
  const names = new Map((languages || []).map((language) => [language.code, language]));
  const codes = Array.isArray(available) ? [...available] : [];
  const missingCurrent = !codes.includes(lang);
  if (missingCurrent) codes.unshift(lang);
  if (codes.length < 2) return null;

  const label = (code) => {
    const info = names.get(code);
    const name = info ? (info.nativeName && info.nativeName !== info.name ? `${info.nativeName} (${info.name})` : info.name) : code;
    return missingCurrent && code === lang ? `${name} - ${t("notAvailableShort")}` : name;
  };

  const change = (event) => {
    router.push({ pathname: router.pathname, query: { ...router.query, lang: event.target.value } }, undefined, {
      scroll: false,
    });
  };

  return (
    <label className={styles.languageSwitch}>
      <span className={styles.languageLabel}>{t("readIn")}</span>
      <select value={lang} onChange={change}>
        {codes.map((code) => (
          <option key={code} value={code}>
            {label(code)}
          </option>
        ))}
      </select>
    </label>
  );
}

// HadeethEnc explanation, benefits (`hints`), word meanings and sources.
function Details({ details }) {
  const { t, lang, languageName, directionOf } = useLocale();
  if (!details) return null;

  const code = details.languageCode;
  const dir = directionOf(code);
  const hints = (details.hints || []).map(cleanText).filter(Boolean);
  const words = (details.wordsMeanings || []).filter((item) => item && (item.word || item.meaning));

  return (
    <div className={styles.details}>
      {details.isFallback && (
        <p className={styles.fallbackNote}>{t("detailsFallback", { language: languageName(lang) })}</p>
      )}

      {details.attribution && (
        <p className={styles.attribution} lang={code} dir={dir}>
          <span className={styles.attributionLabel}>{t("attribution")}:</span> {cleanText(details.attribution)}
        </p>
      )}

      {details.explanation && (
        <section className={styles.section} aria-labelledby="hadith-explanation">
          <h2 id="hadith-explanation" className={styles.sectionTitle}>
            {t("explanation")}
          </h2>
          <div className={styles.prose} lang={code} dir={dir}>
            {cleanText(details.explanation)}
          </div>
        </section>
      )}

      {hints.length > 0 && (
        <section className={styles.section} aria-labelledby="hadith-benefits">
          <h2 id="hadith-benefits" className={styles.sectionTitle}>
            {t("benefits")}
          </h2>
          <ul className={styles.hints} lang={code} dir={dir}>
            {hints.map((hint, index) => (
              <li key={index}>{hint}</li>
            ))}
          </ul>
        </section>
      )}

      {words.length > 0 && (
        <section className={styles.section} aria-labelledby="hadith-words">
          <h2 id="hadith-words" className={styles.sectionTitle}>
            {t("wordMeanings")}
          </h2>
          <dl className={styles.words} lang={code}>
            {words.map((item, index) => (
              <div key={index}>
                <dt dir="auto">{cleanText(item.word)}</dt>
                <dd dir="auto">{cleanText(item.meaning)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {details.reference && (
        <section className={styles.section} aria-labelledby="hadith-sources">
          <h2 id="hadith-sources" className={styles.sectionTitle}>
            {t("sources")}
          </h2>
          <div className={styles.reference} dir="rtl" lang="ar">
            {cleanText(details.reference)}
          </div>
        </section>
      )}
    </div>
  );
}

export default function HadithDetail({ hadith, languages }) {
  const { t } = useLocale();
  const router = useRouter();
  const { addLastRead } = useContext(PinContext);
  const { book, chapter } = hadith;

  useEffect(() => {
    addLastRead(storedHadithRef(hadith, book));
    // Record once per hadith.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hadith.id]);

  const keepLang = router.query.lang ? `?lang=${encodeURIComponent(router.query.lang)}` : "";
  const showChapter = chapter && !isCategoryBook(book);
  const chapterText = showChapter
    ? chapter.chapterNo === UNASSIGNED_CHAPTER
      ? t("unassignedChapter")
      : `${t("chapter")} ${chapter.chapterNo}: ${chapter.name}`
    : null;
  const reference = citation(hadith, book);

  return (
    <article className={styles.detail}>
      <header className={styles.header}>
        <div className={styles.topRow}>
          <p className={styles.context}>
            <Link href={bookPath(book)}>{book.name}</Link>
            {showChapter && (
              <>
                <span aria-hidden="true"> · </span>
                <Link href={chapterPath(book.slug, chapter.chapterNo)}>{chapterText}</Link>
              </>
            )}
          </p>
          <div className={styles.options}>
            <HadithOptions hadith={hadith} book={book} />
          </div>
        </div>

        <h1 className={styles.title} dir="auto">
          {hadith.title ? cleanText(hadith.title) : reference}
        </h1>

        <div className={styles.facts}>
          <span className={styles.fact}>
            {t("hadithNumber")}: <strong>{hadith.referenceNumber}</strong>
          </span>
          {hadith.title && <span className={styles.fact}>{reference}</span>}
          <LanguageSwitch available={hadith.availableLanguages} languages={languages} />
        </div>
      </header>

      <section className={styles.arabicBlock} aria-label={t("arabicText")}>
        <ArabicText text={hadith.arabic} large />
      </section>

      <section className={styles.translationBlock}>
        <Translation translation={hadith.translation} showNote />
      </section>

      <Grades grades={hadith.grades} gradeText={hadith.gradeText} variant="full" />

      <Details details={hadith.details} />

      {hadith.categories && hadith.categories.length > 0 && (
        <section className={styles.section} aria-labelledby="hadith-categories">
          <h2 id="hadith-categories" className={styles.sectionTitle}>
            {t("hadithCategories")}
          </h2>
          <ul className={styles.chips}>
            {hadith.categories.map((category) => (
              <li key={category.id}>
                <Link href={categoryPath(category)} className={styles.chip}>
                  <bdi>{category.title}</bdi>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hadith.related && hadith.related.length > 0 && (
        <section className={styles.section} aria-labelledby="hadith-related">
          <h2 id="hadith-related" className={styles.sectionTitle}>
            {t("relatedHadiths")}
          </h2>
          <ul className={styles.chips}>
            {hadith.related.map((item) => (
              <li key={item.id}>
                <Link href={`/hadiths/${item.id}${keepLang}`} className={styles.chip}>
                  {item.bookSlug === "hadeethenc" ? "HadeethEnc" : item.bookName} {item.referenceNumber}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
