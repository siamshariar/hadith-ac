import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { server, config } from "../lib/config";
import {
  ApiError,
  MIN_SEARCH_LENGTH,
  getBookHadith,
  getBooks,
  getLanguages,
  loadPage,
  parsePage,
  searchHadiths,
} from "../lib/api";
import { REFERENCE_NUMBER, parseReference } from "../lib/reference";
import { booksBySlug, hadithPath, shortBookName } from "../lib/hadith";
import { useLocale } from "../contexts/LocaleContext";
import useRouteLoading from "../hooks/useRouteLoading";
import Meta from "../components/core/meta";
import Breadcrumbs from "../components/core/breadcrumbs";
import ErrorState, { EmptyState } from "../components/core/error";
import Pagination, { pageHref } from "../components/core/pagination";
import Layout from "../components/layouts/LayoutSecondary";
import HadithCard, { HadithList } from "../components/hadith/HadithCard";
import { HighlightProvider } from "../components/hadith/Highlight";
import { GoToHadith } from "../components/home/search";
import SearchIcon from "../components/icons/Search";
import styles from "../components/content/Page.module.scss";
import searchStyles from "../components/home/search.module.scss";

// One GET form: text, collection and language. Changing a filter re-runs
// the search; everything lives in the URL.
function SearchForm({ query, book, books, languages }) {
  const router = useRouter();
  const { t, lang } = useLocale();
  const [value, setValue] = useState(query);

  const go = (overrides = {}) => {
    const q = (overrides.q ?? value).trim();
    if (q.length < MIN_SEARCH_LENGTH) return;
    const params = { q };
    const selectedBook = overrides.book ?? book;
    const selectedLang = overrides.lang ?? (router.query.lang || "");
    if (selectedBook) params.book = selectedBook;
    if (selectedLang) params.lang = selectedLang;
    router.push({ pathname: "/search", query: params });
  };

  return (
    <form
      action="/search"
      method="get"
      role="search"
      className={styles.searchForm}
      onSubmit={(event) => {
        event.preventDefault();
        go();
      }}
    >
      <div className={searchStyles.search}>
        <span className={searchStyles.icon} aria-hidden="true">
          <SearchIcon />
        </span>
        <input
          type="search"
          name="q"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={t("searchPlaceholderLong")}
          aria-label={t("search")}
          minLength={MIN_SEARCH_LENGTH}
          autoComplete="off"
          enterKeyHint="search"
        />
        <button type="submit">{t("searchButton")}</button>
      </div>
      <div className={styles.filters}>
        {books.length > 0 && (
          <label className={styles.filter}>
            <span>{t("books")}</span>
            <select name="book" value={book} onChange={(event) => go({ book: event.target.value })} className={styles.select}>
              <option value="">{t("searchAllBooks")}</option>
              {books.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {shortBookName(item)}
                </option>
              ))}
            </select>
          </label>
        )}
        {languages.length > 0 && (
          <label className={styles.filter}>
            <span>{t("searchLanguage")}</span>
            <select name="lang" value={lang} onChange={(event) => go({ lang: event.target.value })} className={styles.select}>
              {languages.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.nativeName}
                  {language.nativeName !== language.name ? ` (${language.name})` : ""}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </form>
  );
}

export default function Search({ query, book, results, books, languages, notFound, error }) {
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

        <SearchForm
          key={`${query}|${book}|${lang}`}
          query={query || ""}
          book={book || ""}
          books={bookList}
          languages={languages || []}
        />

        <div className={styles.goRow}>
          <GoToHadith />
        </div>

        {notFound && (
          <p className={`${styles.notice} ${styles.warning}`} role="status">
            {t("referenceNotFound", { query: notFound })} {t("referenceHelp")}
          </p>
        )}

        {!query && !notFound && <p className={styles.notice}>{t("searchTips")}</p>}

        {tooShort && (
          <p className={`${styles.notice} ${styles.warning}`}>{t("searchMinLength", { count: MIN_SEARCH_LENGTH })}</p>
        )}

        {error && <ErrorState error={error} />}

        {results && (
          <section aria-labelledby="search-results" aria-busy={loading ? "true" : undefined}>
            <div className={styles.sectionHead}>
              <h2 id="search-results" className={styles.sectionTitle} aria-live="polite">
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
              {book && bookMap[book] && <span>{shortBookName(bookMap[book])}</span>}
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
              <HighlightProvider query={query} field={searchedArabic ? "arabic" : results.searchedLanguage}>
                <HadithList
                  hadiths={results.hadiths}
                  loading={loading}
                  renderCard={(hadith) => <HadithCard key={hadith.id} hadith={hadith} book={bookMap[hadith.bookSlug]} />}
                />
              </HighlightProvider>
            )}

            <Pagination pagination={results.pagination} hrefFor={(page) => pageHref("/search", baseQuery, page)} />
          </section>
        )}
      </div>
    </>
  );
}

Search.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

const first = (value) => (Array.isArray(value) ? value[0] : value);

export async function getServerSideProps(context) {
  const query = String(first(context.query.q) || "").trim().slice(0, 200);
  const goTo = String(first(context.query.go) || "").trim().slice(0, 100);
  const rawBook = first(context.query.book);
  const book = /^[\w-]+$/.test(String(rawBook || "")) ? String(rawBook) : "";
  const langOverride = first(context.query.lang);

  return loadPage(context, async (lang) => {
    const [books, languages] = await Promise.all([getBooks(lang).catch(() => []), getLanguages().catch(() => [])]);

    // "Go to hadith": ?go=Bukhari 1, ?go=8a&book=sahih-muslim, or a search
    // query that is a reference ("Muslim 8a"). Found: open the hadith.
    let notFound = null;
    const reference = goTo
      ? book && REFERENCE_NUMBER.test(goTo)
        ? { slug: book, number: goTo }
        : parseReference(goTo, books)
      : query
      ? parseReference(query, books)
      : null;
    if (reference) {
      try {
        const hadith = await getBookHadith(reference.slug, reference.number, lang);
        const keep = langOverride ? `?lang=${encodeURIComponent(langOverride)}` : "";
        return { redirect: { destination: `${hadithPath(hadith)}${keep}`, permanent: false } };
      } catch (error) {
        if (!(error instanceof ApiError && error.status === 404)) throw error;
        notFound = goTo || query;
      }
    } else if (goTo) {
      notFound = goTo;
    }

    const results =
      query.length >= MIN_SEARCH_LENGTH && !goTo
        ? await searchHadiths(query, lang, {
            page: parsePage(context.query.page),
            perPage: config.perPage,
            book: book || undefined,
          })
        : null;

    return {
      props: {
        query: goTo ? "" : query,
        book,
        results,
        notFound,
        books: books.map(({ slug, code, name, source, totalHadith }) => ({ slug, code, name, source, totalHadith })),
        languages: languages
          .filter((language) => language.code !== "ar")
          .map(({ code, name, nativeName }) => ({ code, name, nativeName }))
          .sort((a, b) => {
            const rank = (code) => (code === "vi" ? 0 : code === "en" ? 1 : 2);
            return rank(a.code) - rank(b.code) || a.name.localeCompare(b.name);
          }),
        backLink: "/",
      },
    };
  });
}
