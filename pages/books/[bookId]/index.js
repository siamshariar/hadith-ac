import Link from "next/link";
import { server } from "../../../lib/config";
import { getBook, loadPage } from "../../../lib/api";
import { UNASSIGNED_CHAPTER, bookPath, chapterPath, isCategoryBook } from "../../../lib/hadith";
import { useLocale } from "../../../contexts/LocaleContext";
import Meta from "../../../components/core/meta";
import Breadcrumbs from "../../../components/core/breadcrumbs";
import ErrorState, { EmptyState } from "../../../components/core/error";
import Layout from "../../../components/layouts/LayoutSecondary";
import styles from "../../../components/content/Page.module.scss";

export default function Book({ book, error }) {
  const { t, formatNumber } = useLocale();

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
          <h1 className={styles.title}>{book.name}</h1>
          {book.nameArabic && (
            <p className={styles.titleArabic} dir="rtl" lang="ar">
              {book.nameArabic}
            </p>
          )}
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
        </header>

        {isCategoryBook(book) && (
          <p className={styles.notice}>
            {t("browseByCategory")} <Link href="/categories">{t("browseCategories")}</Link>
          </p>
        )}

        <section aria-labelledby="book-chapters">
          <h2 id="book-chapters" className="visually_hidden">
            {t("chapter")}
          </h2>
          {chapters.length === 0 ? (
            <EmptyState>{t("noHadiths")}</EmptyState>
          ) : (
            <ol className={`${styles.grid} ${styles.grid3}`}>
              {chapters.map((chapter) => {
                const unassigned = chapter.chapterNo === UNASSIGNED_CHAPTER;
                return (
                  <li key={chapter.chapterNo}>
                    <Link href={chapterPath(book.slug, chapter.chapterNo)} className={styles.tile}>
                      <span className={styles.tileNumber} aria-hidden={unassigned ? "true" : undefined}>
                        {unassigned ? "–" : chapter.chapterNo}
                      </span>
                      <span className={styles.tileBody}>
                        <span className={styles.tileTitle}>
                          {unassigned ? t("unassignedChapter") : chapter.name}
                        </span>
                        {chapter.nameArabic && (
                          <span className={styles.tileArabic} dir="rtl" lang="ar">
                            {chapter.nameArabic}
                          </span>
                        )}
                        <span className={styles.tileMeta}>
                          {formatNumber(chapter.totalHadith)} {t("hadiths")}
                        </span>
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
  return loadPage(context, async (lang) => ({
    props: {
      book: await getBook(context.params.bookId, lang),
      backLink: "/books",
    },
  }));
}
