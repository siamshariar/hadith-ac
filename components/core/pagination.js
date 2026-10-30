import Link from "next/link";
import { useLocale } from "../../contexts/LocaleContext";
import styles from "./pagination.module.scss";

// Page numbers to show: first, last, and a window around the current page.
function pageItems(page, lastPage) {
  const pages = new Set([1, lastPage, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (page >= lastPage - 2) [lastPage - 3, lastPage - 2, lastPage - 1].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= lastPage).sort((a, b) => a - b);

  const items = [];
  sorted.forEach((p, index) => {
    if (index > 0 && p - sorted[index - 1] > 1) items.push(`gap-${p}`);
    items.push(p);
  });
  return items;
}

// URL-driven pagination: every page is a real link (?page=N), so pages can
// be shared, bookmarked and reached with the back button.
export default function Pagination({ pagination, hrefFor }) {
  const { t, formatNumber } = useLocale();
  if (!pagination) return null;

  const { page, perPage, total, lastPage } = pagination;
  if (!lastPage || lastPage <= 1) return null;

  const from = Math.min((page - 1) * perPage + 1, total);
  const to = Math.min(page * perPage, total);

  return (
    <nav className={styles.pagination} aria-label={t("page")}>
      <div className={styles.controls}>
        {page > 1 ? (
          <Link href={hrefFor(page - 1)} className={styles.step} rel="prev">
            <span aria-hidden="true">‹</span> <span className={styles.stepLabel}>{t("previous")}</span>
          </Link>
        ) : (
          <span className={`${styles.step} ${styles.disabled}`} aria-disabled="true">
            <span aria-hidden="true">‹</span> <span className={styles.stepLabel}>{t("previous")}</span>
          </span>
        )}

        {/* Phones: "Trang 3/13" instead of the numbers. */}
        <span className={styles.compact}>
          {t("page")} {formatNumber(page)}/{formatNumber(lastPage)}
        </span>

        <ol className={styles.pages}>
          {pageItems(page, lastPage).map((item) =>
            typeof item === "string" ? (
              <li key={item} className={styles.gap} aria-hidden="true">
                …
              </li>
            ) : (
              <li key={item}>
                {item === page ? (
                  <span className={`${styles.number} ${styles.active}`} aria-current="page">
                    {item}
                  </span>
                ) : (
                  <Link href={hrefFor(item)} className={styles.number} aria-label={`${t("page")} ${item}`}>
                    {item}
                  </Link>
                )}
              </li>
            )
          )}
        </ol>

        {page < lastPage ? (
          <Link href={hrefFor(page + 1)} className={styles.step} rel="next">
            <span className={styles.stepLabel}>{t("next")}</span> <span aria-hidden="true">›</span>
          </Link>
        ) : (
          <span className={`${styles.step} ${styles.disabled}`} aria-disabled="true">
            <span className={styles.stepLabel}>{t("next")}</span> <span aria-hidden="true">›</span>
          </span>
        )}
      </div>

      {total > 0 && (
        <p className={styles.info}>
          {t("showingRange", {
            from: formatNumber(from),
            to: formatNumber(to),
            total: formatNumber(total),
          })}
        </p>
      )}
    </nav>
  );
}

// Builds `pathname?query&page=N` while keeping the other query params.
export function pageHref(pathname, query, page) {
  const params = new URLSearchParams();
  Object.entries(query || {}).forEach(([key, value]) => {
    if (key === "page" || value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? `${pathname}?${search}` : pathname;
}
