import Container from "../core/container";
import BackIcon from "../icons/NavigateBefore";
import { useLocale } from "../../contexts/LocaleContext";
import styles from "./ModalSecondary.module.scss";

export default function Modal({ children, open, controller, title }) {
  const { t } = useLocale();
  return (
    <div className={open ? `${styles.modal} ${styles.open}` : styles.modal}>
      <div className={styles.header}>
        <Container>
          <div className={styles.header_inner}>
            <button type="button" className={styles.icon} onClick={controller(false)} aria-label={t("goBack")} title={t("goBack")}>
              <BackIcon />
            </button>
            <span className={styles.title}>{title}</span>
          </div>
        </Container>
      </div>

      <div className={styles.content}>
        <div className={styles.content_inner}>{children}</div>
      </div>
    </div>
  );
}
