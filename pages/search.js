import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { server, config } from "../lib/config";
import { MIN_SEARCH_LENGTH, getBooks, loadPage, parsePage, searchHadiths } from "../lib/api";
import { booksBySlug, shortBookName } from "../lib/hadith";
import { useLocale } from "../contexts/LocaleContext";
import useRouteLoading from "../hooks/useRouteLoading";
import Meta from "../components/core/meta";
import Breadcrumbs from "../components/core/breadcrumbs";
import ErrorState, { EmptyState } from "../components/core/error";
import Pagination, { pageHref } from "../components/core/pagination";
import Layout from "../components/layouts/LayoutSecondary";
import HadithCard, { HadithList } from "../components/hadith/HadithCard";
import SearchIcon from "../components/icons/Search";
import styles from "../components/content/Page.module.scss";
import searchStyles from "../components/home/search.module.scss";

function SearchForm({ query, book, books }) {
  const router = useRouter();
  const { t } = useLocale();
  const [value, setValue] = useState(query);
  const [selectedBook, setSelectedBook] = useState(book);

  const submit = (event) => {
    event.preventDefault();
    const q = value.trim();
    if (q.length < MIN_SEARCH_LENGTH) return;
    const params = { q };
    if (selectedBook) params.book = selectedBook;
    if (router.query.lang) params.lang = router.query.lang;
    router.push({ pathname: "/search", query: params });
  };

  return (
    <form action="/search" method="get" role="search" className={styles.searchForm} onSubmit={submit}>
      <div className={searchStyles.search}>
        <span className={searchStyles.icon} aria-hidden="true">
          <SearchIcon />
        </span>
        <input
          type="search"
          name="q"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("search")}
          minLength={MIN_SEARCH_LENGTH}
          autoComplete="off"
          enterKeyHint="search"
        />
        <button type="submit">{t("searchButton")}</button>
      </div>
      {books.length > 0 && (
        <select
          name="book"
          value={selectedBook}
          onChange={(event) => setSelectedBook(event.target.value)}
          className={styles.select}
          aria-label={t("books")}
        >
          <option value="">{t("searchAllBooks")}</option>
          {books.map((item) => (
            <option key={item.slug} value={item.slug}>
              {shortBookName(item)}
            </option>
          ))}
        </select>
      )}
    </form>
  );
}

export default function Search({ query, book, results, books, error }) {
  const { t, lang, languageInfo, formatNumber, languageName } = useLocale();
  const router = useRouter();
  const loading = useRouteLoading();
  const bookList = books || [];
  const bookMap = booksBySlug(bookList);
  const tooShort = query && query.length < MIN_SEARCH_LENGTH;

  const totalHadiths = bookList.reduce((sum, item) => sum + (item.totalHadith || 0), 0);
  const searchedArabic = results && results.searchedLanguage === "ar";
  const showCoverage =
    results &&
    !searchedArabic &&
    lang !== "en" &&
    languageInfo &&
    totalHadiths > 0 &&
    languageInfo.totalTranslated < totalHadiths;

  // Keep the query, book filter and any ?lang= override across pages.
  const baseQuery = { q: query, book: book || undefined, lang: router.query.lang || undefined };

  return (
    <>
      <Meta
        title={query ? `${t("search")}: ${query}` : t("search")}
        description="Search hadiths by translation or Arabic text."
        url={`${server}/search`}
        image={`${server}/img/s_logo.png`}
        type="website"
      />

      <div className={styles.page}>
        <Breadcrumbs items={[{ href: "/", label: t("home") }, { label: t("search") }]} />

        <header className={styles.header}>
          <h1 className={styles.title}>{t("search")}</h1>
        </header>

        <SearchForm key={`${query}|${book}`} query={query || ""} book={book || ""} books={bookList} />

        {!query && <p className={styles.notice}>{t("searchTips")}</p>}

        {tooShort && (
          <p className={`${styles.notice} ${styles.warning}`}>{t("searchMinLength", { count: MIN_SEARCH_LENGTH })}</p>
        )}

        {error && <ErrorState error={error} />}

        {results && (
          <section aria-labelledby="search-results" aria-busy={loading ? "true" : undefined}>
            <div className={styles.sectionHead}>
              <h2 id="search-results" className={styles.sectionTitle}>
                {results.pagination.total > 0
                  ? t("searchResults", { count: formatNumber(results.pagination.total), query })
                  : t("searchNoResults", { query })}
              </h2>
            </div>

            <p className={`${styles.meta} ${styles.searchedIn}`}>
              <span>
                {searchedArabic
                  ? t("searchedArabic")
                  : t("searchedLanguage", { language: languageName(results.searchedLanguage) })}
              </span>
            </p>

            {showCoverage && (
              <p className={`${styles.notice} ${styles.warning}`}>
                {t("searchCoverage", {
                  count: formatNumber(languageInfo.totalTranslated),
                  language: languageName(lang),
                })}{" "}
                <Link href={pageHref("/search", { ...baseQuery, lang: "en" }, 1)}>{t("searchInEnglish")}</Link>
              </p>
            )}

            {results.hadiths.length === 0 ? (
              results.pagination.total > 0 ? (
                <EmptyState>
                  {t("pageEmpty")} <Link href={pageHref("/search", baseQuery, 1)}>{t("goToFirstPage")}</Link>
                </EmptyState>
              ) : (
                <EmptyState>{t("searchTips")}</EmptyState>
              )
            ) : (
              <HadithList
                hadiths={results.hadiths}
                loading={loading}
                renderCard={(hadith) => (
                  <HadithCard key={hadith.id} hadith={hadith} book={bookMap[hadith.bookSlug]} />
                )}
              />
            )}

            <Pagination
              pagination={results.pagination}
              hrefFor={(page) => pageHref("/search", baseQuery, page)}
            />
          </section>
        )}
      </div>
    </>
  );
}

Search.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export async function getServerSideProps(context) {
  const raw = Array.isArray(context.query.q) ? context.query.q[0] : context.query.q;
  const query = String(raw || "").trim().slice(0, 200);
  const rawBook = Array.isArray(context.query.book) ? context.query.book[0] : context.query.book;
  const book = /^[\w-]+$/.test(String(rawBook || "")) ? String(rawBook) : "";

  return loadPage(context, async (lang) => {
    const [books, results] = await Promise.all([
      getBooks(lang).catch(() => []),
      query.length >= MIN_SEARCH_LENGTH
        ? searchHadiths(query, lang, {
            page: parsePage(context.query.page),
            perPage: config.perPage,
            book: book || undefined,
          })
        : Promise.resolve(null),
    ]);

    return {
      props: {
        query,
        book,
        results,
        books: books.map(({ slug, code, name, source, totalHadith }) => ({ slug, code, name, source, totalHadith })),
        backLink: "/",
      },
    };
  });
}
