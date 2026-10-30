import Link from "next/link";
import Image from "next/image";
import { site } from "../../lib/sites";
import styles from "./HeaderLogo.module.scss";

// The logo is 2020x343.
const SIZES = { desktop: [153, 26], mobile: [130, 22] };

// The site's logo, linked to the home page: the colour logo in the light
// theme and its dark version (site.logoDark) in the dark one, both in the
// page and switched in CSS on body.dark, so nothing flashes before the
// settings load. A country without a logo (site.logo null), or without a dark
// one, gets a wordmark of its site name in the brand colours instead.
export default function HeaderLogo({ size = "desktop", className = "" }) {
  const [width, height] = SIZES[size] || SIZES.desktop;
  const wordmark = (variant) => (
    <span className={`${styles.wordmark} ${variant}`}>
      <span className={styles.wordmarkText}>{site.siteName}</span>
    </span>
  );

  return (
    <Link href="/" className={`${styles.logo} ${styles[size] || ""} ${className}`} aria-label={site.siteName}>
      {site.logo ? (
        <Image className={styles.onLight} src={site.logo} alt="" width={width} height={height} loading="eager" />
      ) : (
        wordmark(styles.onLight)
      )}
      {site.logo && site.logoDark ? (
        <Image className={styles.onDark} src={site.logoDark} alt="" width={width} height={height} loading="eager" />
      ) : (
        wordmark(styles.onDark)
      )}
    </Link>
  );
}
