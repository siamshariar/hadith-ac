import { Fragment } from "react";
import Link from "next/link";
import { useLocale } from "../../contexts/LocaleContext";
import css from "./style.module.scss";
import styles from "./about.module.scss";

const DEENI_URL = "http://deeniinfotech.com";
const EMAILS = ["deeniinfotech@gmail.com", "quran.vn@gmail.com"];

export default function AboutContent() {
  const { t } = useLocale();
  return (
    <div className={css.wrapper}>
      <div className={css.page_item}>
        <div className={styles.quran_content}>
          <h1 className={styles.title}>{t("about")}</h1>
          <p>
            {t("aboutApp")} {t("siteTagline")}
          </p>
          <p>
            {t("aboutData")} <Link href="/sources">{t("sourcesAndMethod")}</Link>.
          </p>
          <p>
            {t("poweredBy")}{" "}
            <a href={DEENI_URL} target="_blank" rel="noopener noreferrer">
              Deeni Info Tech
            </a>
            : {t("aboutDeeni")}
          </p>
          <p>
            {t("email")}:{" "}
            {EMAILS.map((email, index) => (
              <Fragment key={email}>
                {index > 0 && " | "}
                <a href={`mailto:${email}`}>{email}</a>
              </Fragment>
            ))}
          </p>
        </div>
      </div>
    </div>
  );
}
