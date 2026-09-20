import Link from "next/link";
import Container from "../core/container";
import MenuBookIcon from "../icons/MenuBook";
import NearMeIcon from "../icons/NearMe";
import FavoriteIcon from "../icons/Favorite";
import SubtitlesIcon from "../icons/Subtitles";
import styles from "./Footer.module.scss";

export default function FooterMobile() {
  return (
    <div className={styles.footer}>
      <Container>
        <ul className={styles.menu}>
          <li>
            <Link href="/">

              <MenuBookIcon />

            </Link>
          </li>
          <li>
            <NearMeIcon />
          </li>
          <li>
            <SubtitlesIcon />
          </li>
          <li>
            <FavoriteIcon />
          </li>
          <li>
            <FavoriteIcon />
          </li>
        </ul>
      </Container>
    </div>
  );
}
