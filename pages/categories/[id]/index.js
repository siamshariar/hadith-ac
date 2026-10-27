import Link from "next/link";
import { server } from "../../../lib/config";
import { booksForHadiths, getCategory, getCategoryHadiths, loadPage } from "../../../lib/api";
import { categoryCrumbs, categoryHadithsPath, categoryPath } from "../../../lib/hadith";
import { useLocale } from "../../../contexts/LocaleContext";
import Meta from "../../../components/core/meta";
import Breadcrumbs from "../../../components/core/breadcrumbs";
import ErrorState, { EmptyState } from "../../../components/core/error";
import Layout from "../../../components/layouts/LayoutSecondary";
import HadithCard, { HadithList } from "../../../components/hadith/HadithCard";
import styles from "../../../components/content/Page.module.scss";

const PREVIEW_SIZE = 5;

const childHref = (child) => (child.totalChildren > 0 ? categoryPath(child) : categoryHadithsPath(child));

export default function Category({ category, preview, books, error }) {
  const { t, formatNumber } = useLocale();

  if (error || !category) {
    return (
      <div className={styles.page}>
        <ErrorState error={error} />
      </div>
    );
  }

  const children = category.children || [];
  const hadiths = (preview && preview.hadiths) || [];
  const total = category.totalHadith || 0;

  return (
    <>
      <Meta
        title={category.title}
        description={`${category.title} (${category.titleArabic || ""}): ${total} hadiths.`}
        url={`${server}${categoryPath(category)}`}
        image={`${server}/img/s_logo.png`}
        type="website"
      />

      <div className={styles.page}>
        <Breadcrumbs items={categoryCrumbs(category, t)} />

        <header className={styles.header}>
          <p className={styles.eyebrow}>{t("categories")}</p>
          <h1 className={styles.title}>{category.title}</h1>
          {category.titleArabic && (
            <p className={styles.titleArabic} dir="rtl" lang="ar">
              {category.titleArabic}
            </p>
          )}
          <p className={styles.meta}>
            <span>
              {formatNumber(total)} {t("hadiths")}
            </span>
            {children.length > 0 && (
              <span>
                {formatNumber(children.length)} {t("subcategories").toLowerCase()}
              </span>
            )}
          </p>
        </header>

        {children.length > 0 && (
          <section className={styles.section} aria-labelledby="category-children">
            <div className={styles.sectionHead}>
              <h2 id="category-children" className={styles.sectionTitle}>
                {t("subcategories")}
              </h2>
            </div>
            <ul className={styles.grid}>
              {children.map((child) => (
                <li key={child.id}>
                  <Link href={childHref(child)} className={styles.tile}>
                    <span className={styles.tileBody}>
                      <bdi className={styles.tileTitle}>{child.title}</bdi>
                      {child.titleArabic && (
                        <span className={styles.tileArabic} dir="rtl" lang="ar">
                          {child.titleArabic}
                        </span>
                      )}
                      <span className={styles.tileMeta}>
                        {formatNumber(child.totalHadith)} {t("hadiths")}
                        {child.totalChildren > 0 &&
                          ` · ${formatNumber(child.totalChildren)} ${t("subcategories").toLowerCase()}`}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className={styles.section} aria-labelledby="category-hadiths">
          <div className={styles.sectionHead}>
            <h2 id="category-hadiths" className={styles.sectionTitle}>
              {t("hadithsInCategory")}
            </h2>
          </div>

          {hadiths.length === 0 ? (
            <EmptyState>{t("noHadiths")}</EmptyState>
          ) : (
            <HadithList
              hadiths={hadiths}
              renderCard={(hadith) => <HadithCard key={hadith.id} hadith={hadith} book={books[hadith.bookSlug]} />}
            />
          )}

          {total > hadiths.length && (
            <p className={styles.more}>
              <Link href={categoryHadithsPath(category)} className={styles.button}>
                {t("allHadithsInCategory", { count: formatNumber(total) })}
              </Link>
            </p>
          )}
        </section>
      </div>
    </>
  );
}

Category.getLayout = function getLayout(page) {
  const { category } = page.props;
  return <Layout selectedCategoryId={category ? category.id : null}>{page}</Layout>;
};

export async function getServerSideProps(context) {
  const { id } = context.params;
  return loadPage(context, async (lang) => {
    const [category, preview] = await Promise.all([
      getCategory(id, lang),
      getCategoryHadiths(id, lang, { perPage: PREVIEW_SIZE }),
    ]);
    return {
      props: {
        category,
        preview,
        books: await booksForHadiths(preview.hadiths, lang),
        backLink: category.breadcrumbs && category.breadcrumbs.length
          ? categoryPath(category.breadcrumbs[category.breadcrumbs.length - 1])
          : "/categories",
      },
    };
  });
}
