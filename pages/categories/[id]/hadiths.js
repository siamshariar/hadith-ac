import Link from "next/link";
import { server, config } from "../../../lib/config";
import { booksForHadiths, getCategoryHadiths, loadPage, parsePage } from "../../../lib/api";
import { categoryCrumbs, categoryHadithsPath, categoryPath } from "../../../lib/hadith";
import { useLocale } from "../../../contexts/LocaleContext";
import useRouteLoading from "../../../hooks/useRouteLoading";
import Meta from "../../../components/core/meta";
import Breadcrumbs from "../../../components/core/breadcrumbs";
import ErrorState, { EmptyState } from "../../../components/core/error";
import Pagination, { pageHref } from "../../../components/core/pagination";
import Layout from "../../../components/layouts/LayoutSecondary";
import HadithCard, { HadithList } from "../../../components/hadith/HadithCard";
import styles from "../../../components/content/Page.module.scss";

export default function CategoryHadiths({ data, books, direct, error }) {
  const { t, formatNumber } = useLocale();
  const loading = useRouteLoading();

  if (error || !data) {
    return (
      <div className={styles.page}>
        <ErrorState error={error} />
      </div>
    );
  }

  const { category, hadiths, pagination } = data;
  const basePath = categoryHadithsPath(category);
  const query = direct ? { direct: 1 } : {};
  const crumbs = categoryCrumbs(category, t, { linkCurrent: true });
  crumbs.push({ label: t("hadith") });
  const pastLastPage = hadiths.length === 0 && pagination.total > 0;

  return (
    <>
      <Meta
        title={`${t("hadithsInCategory")}: ${category.title}`}
        description={`${category.title}: ${pagination.total} hadiths.`}
        url={`${server}${pageHref(basePath, query, pagination.page)}`}
        image={`${server}/img/s_logo.png`}
        type="website"
      />

      <div className={styles.page}>
        <Breadcrumbs items={crumbs} />

        <header className={styles.header}>
          <p className={styles.eyebrow}>{t("hadithsInCategory")}</p>
          <h1 className={styles.title}>{category.title}</h1>
          {category.titleArabic && (
            <p className={styles.titleArabic} dir="rtl" lang="ar">
              {category.titleArabic}
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

        {category.totalChildren > 0 && (
          <div className={styles.toolbar}>
            <div className={styles.chips} role="group" aria-label={t("subcategories")}>
              <Link
                href={basePath}
                className={`${styles.chip} ${!direct ? styles.chipActive : ""}`}
                aria-current={!direct ? "true" : undefined}
              >
                {t("includeSub")}
                <span className={styles.chipCount}>{formatNumber(category.totalHadith)}</span>
              </Link>
              <Link
                href={`${basePath}?direct=1`}
                className={`${styles.chip} ${direct ? styles.chipActive : ""}`}
                aria-current={direct ? "true" : undefined}
              >
                {t("onlyDirect")}
              </Link>
            </div>
            <Link href={categoryPath(category)} className={styles.sectionLink}>
              {t("subcategories")} <span aria-hidden="true">→</span>
            </Link>
          </div>
        )}

        {pastLastPage ? (
          <EmptyState>
            {t("pageEmpty")} <Link href={pageHref(basePath, query, 1)}>{t("goToFirstPage")}</Link>
          </EmptyState>
        ) : hadiths.length === 0 ? (
          <EmptyState>{t("noHadiths")}</EmptyState>
        ) : (
          <HadithList
            hadiths={hadiths}
            loading={loading}
            renderCard={(hadith) => <HadithCard key={hadith.id} hadith={hadith} book={books[hadith.bookSlug]} />}
          />
        )}

        <Pagination pagination={pagination} hrefFor={(page) => pageHref(basePath, query, page)} />
      </div>
    </>
  );
}

CategoryHadiths.getLayout = function getLayout(page) {
  const { data } = page.props;
  return <Layout selectedCategoryId={data ? data.category.id : null}>{page}</Layout>;
};

export async function getServerSideProps(context) {
  const { id } = context.params;
  const direct = context.query.direct === "1";

  return loadPage(context, async (lang) => {
    const data = await getCategoryHadiths(id, lang, {
      page: parsePage(context.query.page),
      perPage: config.perPage,
      direct,
    });
    return {
      props: {
        data,
        direct,
        books: await booksForHadiths(data.hadiths, lang),
        backLink: categoryPath(data.category),
      },
    };
  });
}
