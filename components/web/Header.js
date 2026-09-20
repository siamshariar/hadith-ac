"use client";

import styles from "./Header.module.scss";
import { useState, useEffect, useRef, useContext } from "react";
import { SettingsContext } from "../../contexts/SettingsContext";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import MenuList from "@mui/material/MenuList";
import MenuItem from "@mui/material/MenuItem";
import Modal from "../utils/ModalPrimary";
import Settings from "../settings/index";
import Bookmarks from "../bookmark/list";
import Pin from "../pin/list";
import LastRead from "../last-read/list";
import Brightness4Icon from "../icons/Brightness4";
import Brightness7Icon from "../icons/Brightness7";
import MoreVertIcon from "../icons/MoreVert";
import BookmarkBorderIcon from "../icons/BookmarkBorder";
import InfoIcon from "../icons/Info";
import PinOutlineIcon from "../icons/PinOutline";
import AutoStoriesIcon from "../icons/AutoStories";
import SettingsIcon from "../icons/SettingsOutlined";

export default function HeaderWeb({ page }) {
  const router = useRouter();

  const { theme, changeTheme } = useContext(SettingsContext);

  const modeSwitcher = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    changeTheme(newTheme);
  };

  const header = useRef(null);
  const [offset, setOffset] = useState(0);
  const [didMount, setDidMount] = useState(false);

  useEffect(() => {
    setDidMount(true);
    window.onscroll = () => {
      setOffset(window.pageYOffset);
    };
    if (offset > 5) {
      header.current.classList.add(styles.scrolled);
    } else {
      header.current.classList.remove(styles.scrolled);
    }

    return () => setDidMount(false);
  }, [offset]);

  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState(null);
  const [modalContent, setModalContent] = useState(null);

  const handleModalClose = (open) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }
    setModalOpen(open);
  };

  const handleItem = (e, item, title) => {
    e.preventDefault();
    handleClose();

    if (item === "about") {
      router.push("/about");
    } else {
      setModalTitle(title);
      setModalContent(item);
      setModalOpen(true);
    }
  };

  return (
    <>
      <Modal
        open={modalOpen}
        closer={handleModalClose}
        title={modalTitle}
        content={modalContent}
      />
      <div className={`${styles.header} ${styles[page]}`} ref={header}>
        <div className={styles.content}>
          <div className={styles.left}>
            {theme === "light" && (
              <Link href="/" className={`${styles.logo} ${styles.logo_normal}`}>

                <Image
                  src="/img/logo.png"
                  alt="Hadith VN"
                  width={153}
                  height={26}
                  loading="eager"
                />

              </Link>
            )}

            {theme === "light" && (
              <Link href="/" className={`${styles.logo} ${styles.logo_white}`}>

                <Image
                  src="/img/logo_full_white.png"
                  alt="Hadith VN"
                  width={153}
                  height={26}
                  loading="eager"
                />

              </Link>
            )}

            {theme !== "light" && (
              <Link href="/" className={`${styles.logo} ${styles.logo_full_white}`}>

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
            <IconButton
              className={styles.btn}
              onClick={() => modeSwitcher()}
              aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            >
              {theme === "light" && <Brightness4Icon />}
              {theme !== "light" && <Brightness7Icon />}
            </IconButton>

            <IconButton className={styles.btn} onClick={handleClick} aria-label="More options">
              <MoreVertIcon />
            </IconButton>

            <Popover
              open={open}
              anchorEl={anchorEl}
              onClose={handleClose}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              disableScrollLock={true}
            >
              <MenuList className={styles.menu}>
                <MenuItem
                  onClick={(e) =>
                    handleItem(
                      e,
                      <Bookmarks controller={handleModalClose} />,
                      "Bookmarks"
                    )
                  }
                >
                  <span className={styles.icon}>
                    <BookmarkBorderIcon />
                  </span>
                  <span className={styles.text}>Bookmarks</span>
                </MenuItem>

                <MenuItem
                  onClick={(e) =>
                    handleItem(e, <Pin controller={handleModalClose} />, "Pin")
                  }
                >
                  <span className={styles.icon}>
                    <PinOutlineIcon />
                  </span>
                  <span className={styles.text}>Pin</span>
                </MenuItem>

                <MenuItem
                  onClick={(e) =>
                    handleItem(
                      e,
                      <LastRead controller={handleModalClose} />,
                      "Last Read"
                    )
                  }
                >
                  <span className={styles.icon}>
                    <AutoStoriesIcon />
                  </span>
                  <span className={styles.text}>Last Read</span>
                </MenuItem>

                <MenuItem
                  onClick={(e) =>
                    handleItem(
                      e,
                      <Settings controller={handleModalClose} />,
                      "Settings"
                    )
                  }
                >
                  <span className={styles.icon}>
                    <SettingsIcon />
                  </span>
                  <span className={styles.text}>Settings</span>
                </MenuItem>

                <MenuItem onClick={(e) => handleItem(e, "about", null)}>
                  <span className={styles.icon}>
                    <InfoIcon />
                  </span>
                  <span className={styles.text}>About</span>
                </MenuItem>
              </MenuList>
            </Popover>
          </div>
        </div>
      </div>
    </>
  );
}
