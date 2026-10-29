import Link from "next/link";
import { server } from "../../../lib/config";
import { getBook, getBooks, loadPage } from "../../../lib/api";
import { UNASSIGNED_CHAPTER, bookPath, chapterPath, isCategoryBook } from "../../../lib/hadith";
import { useLocale } from "../../../contexts/LocaleContext";
import Meta from "../../../components/core/meta";
import Breadcrumbs from "../../../components/core/breadcrumbs";
import ErrorState, { EmptyState } from "../../../components/core/error";
import Layout from "../../../components/layouts/LayoutSecondary";
import { GoToHadith } from "../../../components/home/search";
import styles from "../../../components/content/Page.module.scss";

export default function Book({ book, counts, error }) {
  const { t, lang, formatNumber, languageName } = useLocale();

  if (error || !book) {
    return (
      <div className={styles.page}>
        <ErrorState error={error} />
      </div>
    );
  }

  const chapters = book.chapters || [];

  return (
    <>
      <Meta
        title={book.name}
        description={`${book.name} (${book.nameArabic || ""}): ${book.totalHadith} hadiths.`}
        url={`${server}${bookPath(book)}`}
        image={`${server}/img/s_logo.png`}
        type="website"
      />

      <div className={styles.page}>
        <Breadcrumbs
          items={[
            { href: "/", label: t("home") },
            { href: "/books", label: t("books") },
            { label: book.name },
          ]}
        />

        <header className={styles.header}>
          <p className={styles.eyebrow}>{t("books")}</p>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{book.name}</h1>
            {book.nameArabic && (
              <p className={styles.titleArabic} dir="rtl" lang="ar">
                {book.nameArabic}
              </p>
            )}
          </div>
          <p className={styles.meta}>
            <span>
              {formatNumber(book.totalHadith)} {t("hadiths")}
            </span>
            {chapters.length > 1 && (
              <span>
                {formatNumber(chapters.length)} {t("chapters")}
              </span>
            )}
          </p>
          {counts && lang !== "ar" && (counts.own > 0 || counts.linked > 0) && (
            <p className={styles.meta}>
              {counts.own > 0 && (
                <span>{t("translationAvailability", { count: formatNumber(counts.own), language: languageName(lang) })}</span>
              )}
              {counts.linked > 0 && (
                <span>
                  {t("bookLinkedTranslations", { count: formatNumber(counts.linked), language: languageName(lang) })}
                </span>
              )}
            </p>
          )}
        </header>

        {isCategoryBook(book) && (
          <p className={styles.notice}>
            {t("browseByCategory")} <Link href="/categories">{t("browseCategories")}</Link>
          </p>
        )}

        <div className={styles.goRow}>
          <GoToHadith book={book.slug} compact />
        </div>

        {/* Numbered list of the collection's books/chapters: number, name,
            Arabic name (when the source has one), hadith count. */}
        <section aria-labelledby="book-chapters">
          <h2 id="book-chapters" className={styles.sectionTitle}>
            {formatNumber(chapters.length)} {t("chapters")}
          </h2>
          {chapters.length === 0 ? (
            <EmptyState>{t("noHadiths")}</EmptyState>
          ) : (
            <ol className={styles.chapterList}>
              {chapters.map((chapter) => {
                const unassigned = chapter.chapterNo === UNASSIGNED_CHAPTER;
                return (
                  <li key={chapter.chapterNo}>
                    <Link href={chapterPath(book.slug, chapter.chapterNo)} className={styles.chapterRow}>
                      <span className={styles.chapterNo} aria-hidden={unassigned ? "true" : undefined}>
                        {unassigned ? "–" : chapter.chapterNo}
                      </span>
                      <span className={styles.chapterName}>{unassigned ? t("unassignedChapter") : chapter.name}</span>
                      <span className={styles.chapterArabic} dir="rtl" lang="ar">
                        {chapter.nameArabic || ""}
                      </span>
                      <span className={styles.chapterCount}>
                        {formatNumber(chapter.totalHadith)}
                        <span className={styles.chapterCountLabel}> {t("hadiths")}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
    </>
  );
}

Book.getLayout = function getLayout(page) {
  const { book } = page.props;
  return (
    <Layout sidebar="books" selectedBookSlug={book ? book.slug : null}>
      {page}
    </Layout>
  );
};

export async function getServerSideProps(context) {
  return loadPage(context, async (lang) => {
    const [book, books] = await Promise.all([
      getBook(context.params.bookId, lang),
      // The book endpoint has no per-language counts; the (cached) list does.
      getBooks(lang).catch(() => []),
    ]);
    const listed = books.find((item) => item.slug === book.slug);
    return {
      props: {
        book,
        counts: listed ? { own: listed.totalTranslated || 0, linked: listed.totalLinkedTranslated || 0 } : null,
        backLink: "/books",
      },
    };
  });
}
