"use client";

import { useState, useEffect, useContext } from "react";
import { PinContext } from "../../contexts/PinContext";
import { BookmarkContext } from "../../contexts/BookmarkContext";
import { useLocale } from "../../contexts/LocaleContext";
import { isCurrentStoredRef, storedHadithRef } from "../../lib/hadith";
import { buildText } from "../../lib/citation";
import Popover from "@mui/material/Popover";
import MenuList from "@mui/material/MenuList";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import Snackbar from "@mui/material/Snackbar";
import AddBookmark from "../bookmark/add";
import RemoveBookmark from "../bookmark/remove";
import BookmarkIcon from "../icons/Bookmark";
import BookmarkBorder from "../icons/BookmarkBorder";
import MoreIcon from "../icons/MoreVert";
import UnpinIcon from "../icons/Pin";
import PinIcon from "../icons/PinOutline";
import FileCopyIcon from "../icons/FileCopy";

import styles from "./HadithOptions.module.scss";

// The ⋮ menu: bookmark, pin, copy text. Citation, permalink and share are
// visible buttons in the reference block (components/hadith/HadithReference).
// `hadith` is an API hadith object, `book` its collection ({ name, slug ... }).
const HadithOptions = ({ hadith, book, updateBookmarksData, isBookmarkPage }) => {
  const locale = useLocale();
  const { t } = locale;
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handlePopoverOpen = (event) => setAnchorEl(event.currentTarget);
  const handlePopoverClose = () => setAnchorEl(null);

  //snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  // Arabic and the translation(s) shown, each labelled with language and author.
  const handleCopyText = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard
        .writeText(buildText(hadith, book, locale))
        .then(() => setSnackbarOpen(true))
        .catch(() => {});
    }
    handlePopoverClose();
  };

  // bookmarks (only entries saved against the current API ids count)
  const { bookmarks } = useContext(BookmarkContext);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkKey, setBookmarkKey] = useState("");

  useEffect(() => {
    let found = false;
    for (let [key, value] of Object.entries(bookmarks || {})) {
      const entries = (value && value.entry) || [];
      if (entries.some((el) => isCurrentStoredRef(el) && el.id == hadith.id)) {
        setBookmarkKey(key);
        found = true;
        break;
      }
    }
    setIsBookmarked(found);
  }, [bookmarks, anchorEl, hadith.id]);

  const [addBookmarkOpen, setAddBookmarkOpen] = useState(false);
  const [removeBookmarkOpen, setRemoveBookmarkOpen] = useState(false);

  const handleAddBookmark = () => {
    handlePopoverClose();
    setAddBookmarkOpen(true);
  };

  const handleRemoveBookmark = () => {
    handlePopoverClose();
    setRemoveBookmarkOpen(true);
  };

  const handleBookmarkClose = (open) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }
    setAddBookmarkOpen(open);
    setRemoveBookmarkOpen(open);
  };

  // pin options
  const { pin, addPin, removePin } = useContext(PinContext);
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    setIsPinned((pin || []).some((el) => isCurrentStoredRef(el) && el.id == hadith.id));
  }, [pin, hadith.id]);

  const handleAddPin = () => {
    addPin(storedHadithRef(hadith, book));
    handlePopoverClose();
  };

  const handleRemovePin = () => {
    removePin(hadith);
    handlePopoverClose();
  };

  return (
    <>
      <Snackbar
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        message={t("copied")}
      />

      <AddBookmark
        open={addBookmarkOpen}
        closer={handleBookmarkClose}
        entry={storedHadithRef(hadith, book)}
      />

      <RemoveBookmark
        open={removeBookmarkOpen}
        closer={handleBookmarkClose}
        hadith={hadith}
        updateBookmarksData={updateBookmarksData}
        bookmarkKey={bookmarkKey}
        isBookmarkPage={isBookmarkPage}
      />

      <div className={styles.wrapper}>
        <div className={styles.action}>
          <IconButton
            className={styles.more_icon}
            onClick={handlePopoverOpen}
            focusRipple={false}
            aria-label={t("hadithOptions")}
            aria-haspopup="menu"
          >
            <MoreIcon />
          </IconButton>

          <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={handlePopoverClose}
            anchorOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            disableScrollLock={true}
            classes={{ paper: styles.custom_paper }}
          >
            <MenuList>
              {isBookmarked ? (
                <MenuItem onClick={handleRemoveBookmark}>
                  <span className={styles.icon}>
                    <BookmarkIcon />
                  </span>
                  <span className={styles.text}>{t("removeBookmark")}</span>
                </MenuItem>
              ) : (
                <MenuItem onClick={handleAddBookmark}>
                  <span className={styles.icon}>
                    <BookmarkBorder />
                  </span>
                  <span className={styles.text}>{t("bookmark")}</span>
                </MenuItem>
              )}

              {isPinned ? (
                <MenuItem onClick={handleRemovePin}>
                  <span className={styles.icon}>
                    <UnpinIcon />
                  </span>
                  <span className={styles.text}>{t("unpin")}</span>
                </MenuItem>
              ) : (
                <MenuItem onClick={handleAddPin}>
                  <span className={styles.icon}>
                    <PinIcon />
                  </span>
                  <span className={styles.text}>{t("pin")}</span>
                </MenuItem>
              )}

              <MenuItem onClick={handleCopyText}>
                <span className={styles.icon}>
                  <FileCopyIcon />
                </span>
                <span className={styles.text}>{t("copyText")}</span>
              </MenuItem>
            </MenuList>
          </Popover>
        </div>
      </div>
    </>
  );
};

export default HadithOptions;
