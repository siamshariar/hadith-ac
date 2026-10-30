import { server } from "../../lib/config";
import { buildCategoryTree, getCategories, loadPage } from "../../lib/api";
import { useLocale } from "../../contexts/LocaleContext";
import Meta from "../../components/core/meta";
import Breadcrumbs from "../../components/core/breadcrumbs";
import ErrorState from "../../components/core/error";
import Layout from "../../components/layouts/LayoutSecondary";
import { sidebarCategoriesData } from "../../components/sidebar/data";
import CategoryList from "../../components/home/category-list";
import styles from "../../components/content/Page.module.scss";

// The HadeethEnc category tree: top-level categories with their children.
export default function Categories({ categories, total, error }) {
  const { t, formatNumber } = useLocale();

  return (
    <>
      <Meta
        title={t("categories")}
        description="Hadith categories: creed, jurisprudence, virtues and manners, the Quran and its sciences, and more."
        url={`${server}/categories`}
        image={`${server}/img/s_logo.png`}
        type="website"
      />

      <div className={styles.page}>
        <Breadcrumbs items={[{ href: "/", label: t("home") }, { label: t("categories") }]} />

        <header className={styles.header}>
          <h1 className={styles.title}>{t("categories")}</h1>
          {total > 0 && (
            <p className={styles.meta}>
              <span>
                {formatNumber(total)} {t("categories").toLowerCase()}
              </span>
            </p>
          )}
        </header>

        {error ? <ErrorState error={error} /> : <CategoryList categories={categories} />}
      </div>
    </>
  );
}

Categories.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export async function getServerSideProps(context) {
  return loadPage(context, async (lang) => {
    const all = await getCategories(lang);
    // Two levels are enough here; deeper levels are on each category page.
    const categories = buildCategoryTree(all).map(({ children, ...category }) => ({
      ...category,
      children: children.map(({ children: _deeper, ...child }) => child),
    }));
    return {
      props: { categories, total: all.length, sidebarData: await sidebarCategoriesData(lang), backLink: "/" },
    };
  });
}
