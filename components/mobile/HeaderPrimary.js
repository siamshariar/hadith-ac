import { useState, useContext } from "react";
import { SettingsContext } from "../../contexts/SettingsContext";
import Link from "next/link";
import Image from "next/image";
import Container from "../core/container";
import IconButton from "@mui/material/IconButton";
import MobileNav from "./MobileNav";
import MenuIcon from "../icons/Menu";
import Brightness4Icon from "../icons/Brightness4";
import Brightness7Icon from "../icons/Brightness7";
import styles from "./Header.module.scss";

export default function HeaderMobile({
  categoryList,
  categoryTree,
  selectedCategoryId,
}) {
  const { theme, changeTheme } = useContext(SettingsContext);

  const modeSwitcher = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    changeTheme(newTheme);
  };

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const controlMobileNav = (open) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }
    setMobileNavOpen(open);
  };

  return (
    <>
      <div className={styles.header}>
        <Container>
          <div className={styles.wrapper}>
            <div className={styles.left}>
              <IconButton
                className={styles.icon}
                onClick={controlMobileNav(true)}
                focusRipple={false}
                aria-label="Open menu"
              >
                <MenuIcon />
              </IconButton>
            </div>

            <div className={styles.center}>
              {theme === "light" && (
                <Link href="/" className={styles.logo}>

                  <Image
                    src="/img/logo.png"
                    alt="Hadith VN"
                    width={153}
                    height={26}
                    loading="eager"
                  />

                </Link>
              )}

              {theme !== "light" && (
                <Link href="/" className={styles.logo}>

                  <Image
                    src="/img/logo_full_white.png"
                    alt="Hadith VN"
                    width={153}
                    height={26}
                    loading="eager"
                  />

                </Link>
              )}
            </div>

            <div className={styles.right}>
              {/* <IconButton
                className={styles.icon}
                onClick={() => searchModalController(true)}
                focusRipple={false}
              >
                <SearchIcon />
              </IconButton> */}

              <IconButton
                className={styles.icon}
                onClick={() => modeSwitcher()}
                focusRipple={false}
                aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              >
                {theme === "light" && <Brightness4Icon />}
                {theme !== "light" && <Brightness7Icon />}
              </IconButton>
            </div>
          </div>
        </Container>
      </div>
      <MobileNav
        navOpen={mobileNavOpen}
        navControl={controlMobileNav}
        categoryList={categoryList}
        categoryTree={categoryTree}
        selectedCategoryId={selectedCategoryId}
      />
    </>
  );
}
