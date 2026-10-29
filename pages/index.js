import Link from "next/link";
import { server } from "../lib/config";
import { getHome, loadPage } from "../lib/api";
import { useLocale } from "../contexts/LocaleContext";
import Meta from "../components/core/meta";
import Container from "../components/core/container";
import ErrorState from "../components/core/error";
import Layout from "../components/layouts/LayoutPrimary";
import DailyHadith, { Hero } from "../components/home/banner";
import HomeSearch from "../components/home/search";
import Stats from "../components/home/Stats";
import BookList from "../components/home/book-list";
import CategoryList from "../components/home/category-list";
import styles from "../components/home/Home.module.scss";

export default function Home({ home, error }) {
  const { t } = useLocale();

  return (
    <>
      <Meta
        title={t("home")}
        description="Hadith collections in Arabic with translations: Sahih al-Bukhari, Sahih Muslim, the Sunan, Muwatta Malik, the forty-hadith books and HadeethEnc."
        url={server}
        image={`${server}/img/s_logo.png`}
        type="website"
      />

      {error || !home ? (
        <Container>
          <div className={styles.error}>
            <ErrorState error={error} />
          </div>
        </Container>
      ) : (
        <>
          {/* Search first (with "go to hadith"), then the collections, the
              category tree, the hadith of the day and how the data is made. */}
          <Hero>
            <HomeSearch />
          </Hero>
          <Stats totals={home.totals} />

          <Container>
            <div className={styles.sections}>
              <section className={styles.section} aria-labelledby="home-books">
                <div className={styles.sectionHead}>
                  <h2 id="home-books" className={styles.sectionTitle}>
                    {t("books")}
                  </h2>
                  <Link href="/books" className={styles.sectionLink}>
                    {t("viewAll")} <span aria-hidden="true">→</span>
                  </Link>
                </div>
                <BookList books={home.books} showTranslation />
              </section>

              <section className={styles.section} aria-labelledby="home-categories">
                <div className={styles.sectionHead}>
                  <h2 id="home-categories" className={styles.sectionTitle}>
                    {t("categories")}
                  </h2>
                  <Link href="/categories" className={styles.sectionLink}>
                    {t("viewAll")} <span aria-hidden="true">→</span>
                  </Link>
                </div>
                <CategoryList categories={home.categories} columns={2} />
              </section>

              {home.dailyHadith && (
                <section className={styles.section}>
                  <DailyHadith hadith={home.dailyHadith} />
                </section>
              )}

              <p className={styles.sources}>
                <Link href="/sources">
                  {t("sourcesAndMethod")} <span aria-hidden="true">→</span>
                </Link>
              </p>
            </div>
          </Container>
        </>
      )}
    </>
  );
}

Home.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export async function getServerSideProps(context) {
  return loadPage(context, async (lang) => ({
    props: { home: await getHome(lang) },
  }));
}
