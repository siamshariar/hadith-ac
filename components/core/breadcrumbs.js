import Link from "next/link";
import styles from "./breadcrumbs.module.scss";

// items: [{ href, label }]; the last item is the current page and is not a link.
export default function Breadcrumbs({ items = [] }) {
  if (!items.length) return null;

  return (
    <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.href || "current"}-${index}`}>
              {isLast || !item.href ? (
                <span aria-current={isLast ? "page" : undefined}>{item.label}</span>
              ) : (
                <Link href={item.href}>{item.label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
