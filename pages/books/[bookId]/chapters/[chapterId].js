import Link from "next/link";
import { useRouter } from "next/router";
import { server, config } from "../../../../lib/config";
import { getBook, getChapterHadiths, loadPage, parsePage } from "../../../../lib/api";
import { UNASSIGNED_CHAPTER, bookPath, chapterPath } from "../../../../lib/hadith";
import { useLocale } from "../../../../contexts/LocaleContext";
import useRouteLoading from "../../../../hooks/useRouteLoading";
import Meta from "../../../../components/core/meta";
import Breadcrumbs from "../../../../components/core/breadcrumbs";
import ErrorState, { EmptyState } from "../../../../components/core/error";
import Pagination, { pageHref } from "../../../../components/core/pagination";
import Layout from "../../../../components/layouts/LayoutSecondary";
import HadithCard, { HadithList } from "../../../../components/hadith/HadithCard";
import styles from "../../../../components/content/Page.module.scss";

const chapterLabel = (chapter, t) =>
  chapter.chapterNo === UNASSIGNED_CHAPTER ? t("unassignedChapter") : `${t("chapter")} ${chapter.chapterNo}`;

export default function Chapter({ data, neighbours, error }) {
  const { t, formatNumber } = useLocale();
  const router = useRouter();
  const loading = useRouteLoading();

  if (error || !data) {
    return (
      <div className={styles.page}>
        <ErrorState error={error} />
      </div>
    );
  }

  const { book, chapter, hadiths, pagination } = data;
  const unassigned = chapter.chapterNo === UNASSIGNED_CHAPTER;
  const title = unassigned ? t("unassignedChapter") : chapter.name;
  const basePath = chapterPath(book.slug, chapter.chapterNo);
  const pastLastPage = hadiths.length === 0 && pagination.total > 0;

  return (
    <>
      <Meta
        title={`${title} - ${book.name}`}
        description={`${book.name}, ${chapterLabel(chapter, t)}: ${title}.`}
        url={`${server}${pageHref(basePath, {}, pagination.page)}`}
        image={`${server}/img/s_logo.png`}
        type="website"
      />

      <div className={styles.page}>
        <Breadcrumbs
          items={[
            { href: "/", label: t("home") },
            { href: "/books", label: t("books") },
            { href: bookPath(book), label: book.name },
            { label: chapterLabel(chapter, t) },
          ]}
        />

        <header className={styles.header}>
          <p className={styles.eyebrow}>
            {book.name} · {chapterLabel(chapter, t)}
          </p>
          <h1 className={styles.title}>{title}</h1>
          {chapter.nameArabic && (
            <p className={styles.titleArabic} dir="rtl" lang="ar">
              {chapter.nameArabic}
            </p>
          )}
          <p className={styles.meta}>
            <span>
              {formatNumber(pagination.total)} {t("hadiths")}
            </span>
            {pagination.lastPage > 1 && (
              <span>
                {t("page")} {pagination.page}/{pagination.lastPage}
              </span>
            )}
          </p>
        </header>

        {unassigned && <p className={styles.notice}>{t("unassignedChapterNote")}</p>}

        {pastLastPage ? (
          <EmptyState>
            {t("pageEmpty")} <Link href={basePath}>{t("goToFirstPage")}</Link>
          </EmptyState>
        ) : hadiths.length === 0 ? (
          <EmptyState>{t("noHadiths")}</EmptyState>
        ) : (
          <HadithList
            hadiths={hadiths}
            loading={loading}
            renderCard={(hadith) => <HadithCard key={hadith.id} hadith={hadith} book={book} />}
          />
        )}

        <Pagination pagination={pagination} hrefFor={(page) => pageHref(basePath, router.query.lang ? { lang: router.query.lang } : {}, page)} />

        {neighbours && (neighbours.previous || neighbours.next) && (
          <nav className={`${styles.toolbar} ${styles.neighbours}`} aria-label={t("chapter")}>
            {neighbours.previous ? (
              <Link href={chapterPath(book.slug, neighbours.previous.chapterNo)} className={`${styles.button} ${styles.buttonGhost}`}>
                <span aria-hidden="true">‹</span> {chapterLabel(neighbours.previous, t)}
              </Link>
            ) : (
              <span />
            )}
            {neighbours.next && (
              <Link href={chapterPath(book.slug, neighbours.next.chapterNo)} className={`${styles.button} ${styles.buttonGhost}`}>
                {chapterLabel(neighbours.next, t)} <span aria-hidden="true">›</span>
              </Link>
            )}
          </nav>
        )}
      </div>
    </>
  );
}

Chapter.getLayout = function getLayout(page) {
  const { data } = page.props;
  return (
    <Layout
      sidebar="books"
      selectedBookSlug={data ? data.book.slug : null}
      selectedChapterNo={data ? data.chapter.chapterNo : null}
    >
      {page}
    </Layout>
  );
};

export async function getServerSideProps(context) {
  const { bookId, chapterId } = context.params;
  if (!/^-?\d+$/.test(String(chapterId))) return { notFound: true };

  return loadPage(context, async (lang) => {
    const [data, book] = await Promise.all([
      getChapterHadiths(bookId, chapterId, lang, {
        page: parsePage(context.query.page),
        perPage: config.perPage,
      }),
      // Cached; only used for previous/next chapter links.
      getBook(bookId, lang).catch(() => null),
    ]);

    let neighbours = null;
    const chapters = (book && book.chapters) || [];
    const index = chapters.findIndex((chapter) => chapter.chapterNo === data.chapter.chapterNo);
    if (index !== -1) {
      const pick = (chapter) => (chapter ? { chapterNo: chapter.chapterNo, name: chapter.name } : null);
      neighbours = { previous: pick(chapters[index - 1]), next: pick(chapters[index + 1]) };
    }

    return {
      props: {
        data,
        neighbours,
        backLink: bookPath(data.book),
      },
    };
  });
}
