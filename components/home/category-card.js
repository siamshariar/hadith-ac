import { useContext } from "react";
import { SettingsContext } from "../../contexts/SettingsContext";
import Link from "next/link";
import styles from "./category-card.module.scss";

export default function CategoryCard({ category }) {
  const { verseMode } = useContext(SettingsContext);

  // Determine the link based on category hierarchy
  let link;
  if (category.parent_id === null || category.parent_id === 0) {
    // Root category - show subcategories
    link = `/categories/${category.id}`;
  } else {
    // Subcategory - show hadiths
    link = `/categories/${category.id}/hadiths`;
  }

  return (
    <div className={styles.item}>
      <Link href={link} className={styles.wrapper}>

      </Link>
      <span className={styles.number}>{category.id}</span>
      <div className={styles.left}>
        <Link href={link} className={styles.name}>
          {category.name_en || category.title}
        </Link>
        {category.hadiths_count && (
          <div className={styles.count}>
            {category.hadiths_count} hadiths
          </div>
        )}
      </div>
      {/* <div className={styles.right}>{category.nameArabic}</div> */}
    </div>
  );
}
