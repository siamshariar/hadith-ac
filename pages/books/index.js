import { server } from "../../lib/config";
import { getBooks, loadPage } from "../../lib/api";
import { useLocale } from "../../contexts/LocaleContext";
import Meta from "../../components/core/meta";
import Breadcrumbs from "../../components/core/breadcrumbs";
import ErrorState from "../../components/core/error";
import Layout from "../../components/layouts/LayoutSecondary";
import BookList from "../../components/home/book-list";
import styles from "../../components/content/Page.module.scss";

export default function Books({ books, error }) {
  const { t, lang, formatNumber, languageName } = useLocale();
  const list = books || [];
  const translated = list.reduce((sum, book) => sum + (book.totalTranslated || 0), 0);
  const total = list.reduce((sum, book) => sum + (book.totalHadith || 0), 0);

  return (
    <>
      <Meta
        title={t("books")}
        description="Hadith collections: Sahih al-Bukhari, Sahih Muslim, the Sunan, Muwatta Malik, the forty-hadith books and HadeethEnc."
        url={`${server}/books`}
        image={`${server}/img/s_logo.png`}
        type="website"
      />

      <div className={styles.page}>
        <Breadcrumbs items={[{ href: "/", label: t("home") }, { label: t("books") }]} />

        <header className={styles.header}>
          <h1 className={styles.title}>{t("books")}</h1>
          {list.length > 0 && (
            <p className={styles.meta}>
              <span>
                {formatNumber(list.length)} {t("totalBooks").toLowerCase()}
              </span>
              <span>
                {formatNumber(total)} {t("hadiths")}
              </span>
            </p>
          )}
        </header>

        {error ? (
          <ErrorState error={error} />
        ) : (
          <>
            {lang !== "en" && lang !== "ar" && list.length > 0 && translated < total && (
              <p className={`${styles.notice} ${styles.warning}`}>
                {t("translationAvailability", {
                  count: formatNumber(translated),
                  language: languageName(lang),
                })}
                {". "}
                {t("contentLanguageNote")}
              </p>
            )}
            <BookList books={list} showTranslation />
          </>
        )}
      </div>
    </>
  );
}

Books.getLayout = function getLayout(page) {
  return <Layout sidebar="books">{page}</Layout>;
};

export async function getServerSideProps(context) {
  // Old links used /books?book={id}; the book page now lives at /books/{book}.
  const legacyBook = context.query.book;
  if (legacyBook && /^[\w-]+$/.test(String(legacyBook))) {
    return { redirect: { destination: `/books/${legacyBook}`, permanent: true } };
  }

  return loadPage(context, async (lang) => ({
    props: {
      books: await getBooks(lang),
      backLink: "/",
    },
  }));
}
