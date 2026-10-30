import { useLocale } from "../../contexts/LocaleContext";
import { EmailLinks } from "./about";
import css from "./style.module.scss";
import styles from "./about.module.scss";

export default function SupportContent() {
  const { t } = useLocale();
  return (
    <div className={css.wrapper}>
      <div className={css.page_item}>
        <div className={styles.quran_content}>
          <h1 className={styles.title}>{t("support")}</h1>
          <p>{t("supportText")}</p>
          <EmailLinks />
        </div>
      </div>
    </div>
  );
}
