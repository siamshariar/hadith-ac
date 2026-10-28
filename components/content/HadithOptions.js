"use client";

import { useState, useEffect, useContext } from "react";
import { PinContext } from "../../contexts/PinContext";
import { BookmarkContext } from "../../contexts/BookmarkContext";
import { useLocale } from "../../contexts/LocaleContext";
import { server } from "../../lib/config";
import { citation, cleanText, hadithPath, isCurrentStoredRef, storedHadithRef } from "../../lib/hadith";
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
import Share from "../core/share";
import LinkIcon from "../icons/Link";
import FileCopyIcon from "../icons/FileCopy";
import ShareIcon from "../icons/Share";

import styles from "./HadithOptions.module.scss";

// `hadith` is an API hadith object, `book` its collection ({ name, slug ... }).
const HadithOptions = ({ hadith, book, updateBookmarksData, isBookmarkPage }) => {
  const { t, languageName } = useLocale();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handlePopoverOpen = (event) => setAnchorEl(event.currentTarget);
  const handlePopoverClose = () => setAnchorEl(null);

  const reference = citation(hadith, book) || `#${hadith.id}`;
  const url = `${server}${hadithPath(hadith)}`;
  const shareTitle = `${reference} | Hadith | hadith.vn`;

  //snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  const copyText = (text) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    handlePopoverClose();
    setSnackbarOpen(true);
  };

  const handleCopyLink = () => copyText(url);

  // The copied text keeps the same labels as the page: a fallback translation
  // is marked as such, and grades keep their grader names.
  const handleCopyFile = () => {
    const parts = [reference];
    if (hadith.title) parts.push(cleanText(hadith.title));
    if (hadith.arabic) parts.push(cleanText(hadith.arabic));

    const translation = hadith.translation;
    const linked = hadith.linkedTranslation;
    const ownIsNative = translation && translation.text && !translation.isFallback;
    if (!ownIsNative && linked && linked.text) {
      // HadeethEnc's translation of the quoted wording, labelled as such.
      const label = t("linkedTranslation", { language: languageName(linked.languageCode) });
      parts.push(`[${label}] ${cleanText(linked.text)}`);
    }
    if (translation && translation.text) {
      const label = translation.isFallback ? `[${t("fallbackTranslation")}] ` : "";
      parts.push(`${label}${cleanText(translation.text)}`);
    }

    const grades = [];
    if (hadith.gradeText) grades.push(hadith.gradeText);
    (hadith.grades || []).forEach((grade) => grades.push(`${grade.graderName}: ${grade.grade}`));
    if (grades.length) parts.push(`${t("grades")}: ${grades.join("; ")}`);

    parts.push(url);
    copyText(parts.join("\n\n"));
  };

  // share option
  const [shareOpen, setShareOpen] = useState(false);

  const handleShareClose = (open) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }
    setShareOpen(open);
  };

  const handleWebShare = () => {
    handlePopoverClose();
    setShareOpen(true);
  };

  const handleMobileShare = () => {
    handlePopoverClose();
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: shareTitle, url }).catch(() => {});
    } else {
      setShareOpen(true);
    }
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

      <Share open={shareOpen} closer={handleShareClose} url={url} title={shareTitle} />

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
              <MenuItem classes={{ root: styles.mobile_share }} onClick={handleMobileShare}>
                <span className={styles.icon}>
                  <ShareIcon />
                </span>
                <span className={styles.text}>{t("share")}</span>
              </MenuItem>

              <MenuItem classes={{ root: styles.web_share }} onClick={handleWebShare}>
                <span className={styles.icon}>
                  <ShareIcon />
                </span>
                <span className={styles.text}>{t("share")}</span>
              </MenuItem>

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

              <MenuItem onClick={handleCopyFile}>
                <span className={styles.icon}>
                  <FileCopyIcon />
                </span>
                <span className={styles.text}>{t("copy")}</span>
              </MenuItem>

              <MenuItem onClick={handleCopyLink}>
                <span className={styles.icon}>
                  <LinkIcon />
                </span>
                <span className={styles.text}>{t("copyLink")}</span>
              </MenuItem>
            </MenuList>
          </Popover>
        </div>
      </div>
    </>
  );
};

export default HadithOptions;
