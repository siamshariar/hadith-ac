import { useState } from "react";
import { useRouter } from "next/router";
import Container from "../core/container";
import SearchIcon from "../icons/Search";
import { useLocale } from "../../contexts/LocaleContext";
import { MIN_SEARCH_LENGTH } from "../../lib/api";
import styles from "./search.module.scss";

// Search box; submits to /search (also works as a plain GET form).
export default function HomeSearch({ initialQuery = "", book = "", embedded = false }) {
  const router = useRouter();
  const { t } = useLocale();
  const [query, setQuery] = useState(initialQuery);

  const submit = (event) => {
    event.preventDefault();
    const q = query.trim();
    if (q.length < MIN_SEARCH_LENGTH) return;
    const params = { q };
    if (book) params.book = book;
    router.push({ pathname: "/search", query: params });
  };

  const form = (
    <form action="/search" method="get" role="search" className={styles.search} onSubmit={submit}>
      <span className={styles.icon} aria-hidden="true">
        <SearchIcon />
      </span>
      <input
        type="search"
        name="q"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t("searchPlaceholder")}
        aria-label={t("search")}
        minLength={MIN_SEARCH_LENGTH}
        autoComplete="off"
        enterKeyHint="search"
      />
      {book && <input type="hidden" name="book" value={book} />}
      <button type="submit">{t("searchButton")}</button>
    </form>
  );

  if (embedded) return form;

  return (
    <div className={styles.parent}>
      <Container>{form}</Container>
    </div>
  );
}
