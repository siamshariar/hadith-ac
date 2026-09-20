import Link from "next/link";
import Container from "../core/container";
import styles from "./Footer.module.scss";

export default function FooterWeb() {
  return (
    <div className={styles.footer}>
      <Container>
        <div className={styles.bottom}>
          <p className={styles.copyright}>
            <span>&copy; {new Date().getFullYear()} </span>
            <Link href="/about">
              Hadith.vn
            </Link>
            <span> All Rights Reserved</span>
          </p>

          <ul className={styles.menu}>
            <li>
              <Link href="/support">
                Support
              </Link>
            </li>
            <li>
              <Link href="/grateful">
                Grateful
              </Link>
            </li>
            <li>
              <Link href="/contact">
                Contact
              </Link>
            </li>
          </ul>

          <p className={styles.credit}>
            Powered By -{" "}
            <a href="http://deeniinfotech.com/" target="_blank">
              Deeni Info Tech
            </a>
          </p>
        </div>
      </Container>
    </div>
  );
}
