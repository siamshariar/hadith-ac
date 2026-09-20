import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Container from "../core/container";
import CategoryModal from "./CategoryModal";
import SettingsModal from "./settings-modal";
import BackIcon from "../icons/NavigateBefore";
import DropDownIcon from "../icons/ArrowDropDown";
import TuneIcon from "../icons/Tune";
import styles from "./Header.module.scss";
import {useRouter} from "next/router";

export default function HeaderMobile({
  contentTitle,
  categoryList,
  categoryTree,
  selectedCategoryId,
  backLink,
}) {
  const router = useRouter()
  const [categoryOpen, setCategoryOpen] = useState(false);

  const handleCategoryModal = (open) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }
    setCategoryOpen(open);
  };

  // settings modal
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleSettingsModal = (open) => (event) => {
    event.preventDefault();
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }
    setSettingsOpen(open);
  };

  // show hide appbar on scroll
  const header = useRef(null);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [didMount, setDidMount] = useState(false);

  // useEffect(() => {
  //     setDidMount(true)
  //
  //     const viewport = document.getElementById('viewport')
  //
  //     viewport.onscroll = () => {
  //         setScrollTop(viewport.scrollTop)
  //     }
  //     if (scrollTop > lastScrollTop) {
  //         header.current.classList.add(styles.scroll_up)
  //     }
  //     else {
  //         header.current.classList.remove(styles.scroll_up)
  //     }
  //     setLastScrollTop(scrollTop)
  //
  //     return () => setDidMount(false)
  // }, [scrollTop])

  const [historyLength, setHistoryLength] = useState(0)

  useEffect(() => {
    setHistoryLength(window.history.length)
  }, [])

  return (
    <>
      <div className={styles.header} ref={header}>
        <Container>
          <div className={styles.wrapper}>
            <div className={styles.left}>
              {/*<Link href={backLink ?? '/'}>*/}
              {/*  <a className={styles.icon}>*/}
              {/*    <BackIcon />*/}
              {/*  </a>*/}
              {/*</Link>*/}
              {backLink && (
                  <span
                      className={styles.icon}
                      onClick={historyLength > 2 ? () => router.back() : () => router.push(`${backLink}`)}
                  >
                <BackIcon />
              </span>
              )}
            </div>

            <div className={styles.center} onClick={handleCategoryModal(true)}>
              <span>Danh mục</span>
              <span className={styles.icon}>
                <DropDownIcon />
              </span>
            </div>

            <div className={styles.right}>
              <Link
                href="/settings"
                className={styles.icon}
                onClick={handleSettingsModal(true)}>

                <TuneIcon />

              </Link>
            </div>
          </div>
        </Container>
      </div>
      <CategoryModal
        open={categoryOpen}
        controller={handleCategoryModal}
        categoryList={categoryList}
        categoryTree={categoryTree}
        selectedCategoryId={selectedCategoryId}
      />
      <SettingsModal open={settingsOpen} controller={handleSettingsModal} />
    </>
  );
}
