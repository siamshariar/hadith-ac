import { server } from "../../lib/config";
import { getLanguages, loadPage } from "../../lib/api";
import {
  UNASSIGNED_CHAPTER,
  bookPath,
  chapterPath,
  citation,
  cleanText,
  hadithPath,
  isCategoryBook,
  lettered,
  shortBookName,
} from "../../lib/hadith";
import { useLocale } from "../../contexts/LocaleContext";
import Meta from "../core/meta";
import Breadcrumbs from "../core/breadcrumbs";
import ErrorState from "../core/error";
import Layout from "../layouts/LayoutSecondary";
import HadithDetail from "./HadithDetail";
import styles from "../content/Page.module.scss";

// Shared by /hadiths/{id} and /books/{book}/hadiths/{number}.
export default function HadithPage({ hadith, languages, error }) {
  const { t } = useLocale();

  if (error || !hadith) {
    return (
      <div className={styles.page}>
        <ErrorState error={error} />
      </div>
    );
  }

  const { book, chapter } = hadith;
  const reference = citation(hadith, book);
  const crumbs = [
    { href: "/", label: t("home") },
    { href: "/books", label: t("books") },
    { href: bookPath(book), label: shortBookName(book) },
  ];
  if (chapter && !isCategoryBook(book)) {
    crumbs.push({
      href: chapterPath(book.slug, chapter.chapterNo),
      label: chapter.chapterNo === UNASSIGNED_CHAPTER ? t("unassignedChapter") : `${t("chapter")} ${chapter.chapterNo}`,
    });
  }
  crumbs.push({ label: `${t("hadith")} ${lettered(hadith.referenceNumber)}` });

  // Only describe the page with translation text that is in the page language.
  const translation = hadith.translation;
  const snippet =
    translation && translation.text && !translation.isFallback ? cleanText(translation.text).slice(0, 160) : "";

  return (
    <>
      <Meta
        title={hadith.title ? `${cleanText(hadith.title).slice(0, 70)} - ${reference}` : reference}
        description={snippet || `${reference} - ${book.name}`}
        url={`${server}${hadithPath(hadith)}`}
        canonical={`${server}${hadithPath(hadith)}`}
        image={`${server}/img/s_logo.png`}
        type="article"
      />

      <div className={styles.page}>
        <Breadcrumbs items={crumbs} />
        <HadithDetail hadith={hadith} languages={languages} />
      </div>
    </>
  );
}

// HadeethEnc hadiths are browsed by category; the other books by chapter.
export function hadithLayout(page) {
  const { hadith } = page.props;
  if (hadith && isCategoryBook(hadith.book)) {
    const first = hadith.categories && hadith.categories[0];
    return <Layout selectedCategoryId={first ? first.id : null}>{page}</Layout>;
  }
  return (
    <Layout
      sidebar="books"
      selectedBookSlug={hadith ? hadith.book.slug : null}
      selectedChapterNo={hadith && hadith.chapter ? hadith.chapter.chapterNo : null}
    >
      {page}
    </Layout>
  );
}

export function loadHadithPage(context, fetchHadith) {
  return loadPage(context, async (lang) => {
    const [hadith, languages] = await Promise.all([
      fetchHadith(lang),
      // Names for the language switch; the page still works without them.
      getLanguages().catch(() => []),
    ]);
    const available = new Set(hadith.availableLanguages || []);
    available.add(lang);
    return {
      props: {
        hadith,
        languages: languages
          .filter((language) => available.has(language.code))
          .map(({ code, name, nativeName }) => ({ code, name, nativeName })),
        backLink:
          hadith.chapter && !isCategoryBook(hadith.book)
            ? chapterPath(hadith.book.slug, hadith.chapter.chapterNo)
            : bookPath(hadith.book),
      },
    };
  });
}
