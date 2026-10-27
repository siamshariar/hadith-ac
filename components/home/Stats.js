import Container from "../core/container";
import { useLocale } from "../../contexts/LocaleContext";
import styles from "./Stats.module.scss";

// Figures come straight from /hadith/home `totals`; nothing is hardcoded.
export default function Stats({ totals }) {
  const { t, formatNumber } = useLocale();
  if (!totals) return null;

  const items = [
    { key: "hadith", label: t("totalHadiths") },
    { key: "book", label: t("totalBooks") },
    { key: "category", label: t("totalCategories") },
    { key: "language", label: t("totalLanguages") },
  ].filter((item) => totals[item.key] != null);

  if (!items.length) return null;

  return (
    <Container>
      <dl className={styles.stats}>
        {items.map((item) => (
          <div key={item.key} className={styles.item}>
            <dt className={styles.label}>{item.label}</dt>
            <dd className={styles.number}>{formatNumber(totals[item.key])}</dd>
          </div>
        ))}
      </dl>
    </Container>
  );
}
