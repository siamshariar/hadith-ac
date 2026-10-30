import { useLocale } from "../../contexts/LocaleContext";
import css from "./style.module.scss";
import styles from "./about.module.scss";

export default function GratefulContent() {
  const { t } = useLocale();
  return (
    <div className={css.wrapper}>
      <div className={css.page_item}>
        <div className={styles.quran_content}>
          <h1 className={styles.title}>{t("grateful")}</h1>
          <p>{t("gratefulText")}</p>
        </div>
      </div>
    </div>
  );
}
