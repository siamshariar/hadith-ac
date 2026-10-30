import Link from "next/link";
import { server, shareImage } from "../lib/config";
import { getHome, loadPage } from "../lib/api";
import { useLocale } from "../contexts/LocaleContext";
import Meta from "../components/core/meta";
import Container from "../components/core/container";
import ErrorState from "../components/core/error";
import Layout from "../components/layouts/LayoutPrimary";
import DailyHadith, { Hero } from "../components/home/banner";
import HomeSearch from "../components/home/search";
import Stats from "../components/home/Stats";
import ContinueReading from "../components/home/ContinueReading";
import { BookGroups } from "../components/home/book-list";
import CategoryList from "../components/home/category-list";
import styles from "../components/home/Home.module.scss";

export default function Home({ home, error }) {
  const { t } = useLocale();

  return (
    <>
      <Meta
        title={t("home")}
        description={t("siteTagline")}
        url={server}
        image={shareImage}
        type="website"
      />

      {error || !home ? (
        <Container>
          <h1 className="visually_hidden">{t("siteHeading")}</h1>
          <div className={styles.error}>
            <ErrorState error={error} />
          </div>
        </Container>
      ) : (
        <>
          {/* The site heading and search (with "go to hadith"), then the
              hadith of the day and the figures; where the reader left off,
              the collections in groups, the category tree and how the data
              is made. */}
          <Hero>
            <HomeSearch />
          </Hero>

          {home.dailyHadith && (
            <Container>
              <section className={styles.dailySection}>
                <DailyHadith hadith={home.dailyHadith} />
              </section>
            </Container>
          )}
          <Stats totals={home.totals} />

          <Container>
            <div className={styles.sections}>
              <ContinueReading />

              <section className={styles.section} aria-labelledby="home-books">
                <div className={styles.sectionHead}>
                  <h2 id="home-books" className={styles.sectionTitle}>
                    {t("books")}
                  </h2>
                  <Link href="/books" className={styles.sectionLink}>
                    {t("viewAll")} <span aria-hidden="true">→</span>
                  </Link>
                </div>
                <BookGroups books={home.books} showTranslation />
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
