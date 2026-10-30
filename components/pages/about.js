import { Fragment } from "react";
import Link from "next/link";
import { useLocale } from "../../contexts/LocaleContext";
import css from "./style.module.scss";
import styles from "./about.module.scss";

export const DEENI_URL = "http://deeniinfotech.com";
const EMAILS = ["deeniinfotech@gmail.com", "quran.vn@gmail.com"];

// "Email: a@b | c@d" as mailto links (about, contact, support pages).
export function EmailLinks({ emails = EMAILS }) {
  const { t } = useLocale();
  return (
    <p>
      {t("email")}:{" "}
      {emails.map((email, index) => (
        <Fragment key={email}>
          {index > 0 && " | "}
          <a href={`mailto:${email}`}>{email}</a>
        </Fragment>
      ))}
    </p>
  );
}

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
          <EmailLinks />
        </div>
      </div>
    </div>
  );
}
