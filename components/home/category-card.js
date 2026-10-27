import Link from "next/link";
import { useLocale } from "../../contexts/LocaleContext";
import { categoryPath } from "../../lib/hadith";
import styles from "./category-card.module.scss";

// A top-level category with its children (from /hadith/home).
export default function CategoryCard({ category, index }) {
  const { t, formatNumber } = useLocale();
  const children = category.children || [];

  return (
    <div className={styles.item}>
      <Link href={categoryPath(category)} className={styles.head}>
        <span className={styles.number}>{index}</span>
        <span className={styles.left}>
          <bdi className={styles.name}>{category.title}</bdi>
          <span className={styles.count}>
            {formatNumber(category.totalHadith)} {t("hadiths")}
          </span>
        </span>
        {category.titleArabic && (
          <span className={styles.right} dir="rtl" lang="ar">
            {category.titleArabic}
          </span>
        )}
      </Link>

      {children.length > 0 && (
        <ul className={styles.children} aria-label={`${t("subcategories")}: ${category.title}`}>
          {children.map((child) => (
            <li key={child.id}>
              <Link href={categoryPath(child)} className={styles.child}>
                <bdi>{child.title}</bdi>
                <span className={styles.childCount}>{formatNumber(child.totalHadith)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
