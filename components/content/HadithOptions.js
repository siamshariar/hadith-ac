"use client";

import { useState, useContext } from "react";
import Link from "next/link";
import { PinContext } from "../../contexts/PinContext";
import { BookmarkContext } from "../../contexts/BookmarkContext";
import { useLocale } from "../../contexts/LocaleContext";
import { citablePath, isCurrentStoredRef, storedHadithRef } from "../../lib/hadith";
import { buildCitation, buildText, permalink, referenceText, reportErrorHref } from "../../lib/citation";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Snackbar from "@mui/material/Snackbar";
import AddBookmark from "../bookmark/add";
import RemoveBookmark from "../bookmark/remove";
import Share from "../core/share";
import BookmarkIcon from "../icons/Bookmark";
import BookmarkBorder from "../icons/BookmarkBorder";
import FileCopyIcon from "../icons/FileCopy";
import LinkIcon from "../icons/Link";
import ShareIcon from "../icons/ShareOutlined";
import MoreIcon from "../icons/MoreHoriz";
import UnpinIcon from "../icons/Pin";
import PinIcon from "../icons/PinOutline";
import FeedbackIcon from "../icons/Feedback";
import EastIcon from "../icons/East";

import styles from "./HadithOptions.module.scss";

// One row of 44px icon buttons for a hadith (cards and the detail page):
// bookmark, copy (text / citation / link), share, and ⋯ for pin, details and
// "report an error". `hadith` is an API hadith object, `book` its collection.
// `showDetails`: add "view details" to the ⋯ menu (lists).
const HadithOptions = ({ hadith, book, updateBookmarksData, isBookmarkPage, showDetails = false }) => {
  const locale = useLocale();
  const { t } = locale;
  const [copyAnchor, setCopyAnchor] = useState(null);
  const [moreAnchor, setMoreAnchor] = useState(null);
  const [message, setMessage] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const citation = referenceText(hadith, book, t);
  const url = permalink(hadith, book);
  const menuId = `hadith-${hadith.id}`;

  const copy = (text) => {
    setCopyAnchor(null);
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard
      .writeText(text)
      .then(() => setMessage(t("copied")))
      .catch(() => {});
  };

  const share = () => {
    const title = `${citation} | Hadith.vn`;
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title, url }).catch(() => {});
    } else {
      setShareOpen(true);
    }
  };

  const closeShare = (open) => (event) => {
    if (event && event.type === "keydown" && (event.key === "Tab" || event.key === "Shift")) return;
    setShareOpen(open);
  };

  // bookmarks (only entries saved against the current API ids count)
  const { bookmarks } = useContext(BookmarkContext);
  const bookmarkKey =
    Object.keys(bookmarks || {}).find((key) => {
      const entries = (bookmarks[key] && bookmarks[key].entry) || [];
      return entries.some((el) => isCurrentStoredRef(el) && el.id == hadith.id);
    }) || "";
  const isBookmarked = Boolean(bookmarkKey);
  const [addBookmarkOpen, setAddBookmarkOpen] = useState(false);
  const [removeBookmarkOpen, setRemoveBookmarkOpen] = useState(false);

  const handleBookmarkClose = (open) => (event) => {
    if (event && event.type === "keydown" && (event.key === "Tab" || event.key === "Shift")) return;
    setAddBookmarkOpen(open);
    setRemoveBookmarkOpen(open);
  };

  // pins
  const { pin, addPin, removePin } = useContext(PinContext);
  const isPinned = (pin || []).some((el) => isCurrentStoredRef(el) && el.id == hadith.id);
  const togglePin = () => {
    if (isPinned) removePin(hadith);
    else addPin(storedHadithRef(hadith, book));
    setMoreAnchor(null);
  };

  const bookmarkLabel = isBookmarked ? t("removeBookmark") : t("bookmark");
  const menuProps = {
    anchorOrigin: { vertical: "bottom", horizontal: "left" },
    transformOrigin: { vertical: "top", horizontal: "left" },
    disableScrollLock: true,
    classes: { paper: styles.paper },
  };

  return (
    <>
      <div className={styles.row} role="group" aria-label={t("hadithActions")}>
        <button
          type="button"
          className={`${styles.button} ${isBookmarked ? styles.active : ""}`}
          onClick={() => (isBookmarked ? setRemoveBookmarkOpen(true) : setAddBookmarkOpen(true))}
          aria-label={bookmarkLabel}
          title={bookmarkLabel}
        >
          {isBookmarked ? <BookmarkIcon /> : <BookmarkBorder />}
        </button>
        <button
          type="button"
          className={styles.button}
          onClick={(event) => setCopyAnchor(event.currentTarget)}
          aria-label={t("copyMenu")}
          title={t("copyMenu")}
          aria-haspopup="menu"
          aria-expanded={copyAnchor ? "true" : "false"}
          aria-controls={copyAnchor ? `${menuId}-copy` : undefined}
        >
          <FileCopyIcon />
        </button>
        <button type="button" className={styles.button} onClick={share} aria-label={t("share")} title={t("share")}>
          <ShareIcon />
        </button>
        <button
          type="button"
          className={styles.button}
          onClick={(event) => setMoreAnchor(event.currentTarget)}
          aria-label={t("moreHadithActions")}
          title={t("moreHadithActions")}
          aria-haspopup="menu"
          aria-expanded={moreAnchor ? "true" : "false"}
          aria-controls={moreAnchor ? `${menuId}-more` : undefined}
        >
          <MoreIcon />
        </button>
      </div>

      <Menu id={`${menuId}-copy`} anchorEl={copyAnchor} open={Boolean(copyAnchor)} onClose={() => setCopyAnchor(null)} {...menuProps}>
        <MenuItem onClick={() => copy(buildText(hadith, book, locale))}>
          <span className={styles.icon}>
            <FileCopyIcon />
          </span>
          <span className={styles.text}>{t("copyText")}</span>
        </MenuItem>
        <MenuItem onClick={() => copy(buildCitation(hadith, book, locale))}>
          <span className={styles.icon}>
            <FileCopyIcon />
          </span>
          <span className={styles.text}>{t("copyCitation")}</span>
        </MenuItem>
        <MenuItem onClick={() => copy(url)}>
          <span className={styles.icon}>
            <LinkIcon />
          </span>
          <span className={styles.text}>{t("copyLink")}</span>
        </MenuItem>
      </Menu>

      <Menu id={`${menuId}-more`} anchorEl={moreAnchor} open={Boolean(moreAnchor)} onClose={() => setMoreAnchor(null)} {...menuProps}>
        <MenuItem onClick={togglePin}>
          <span className={styles.icon}>{isPinned ? <UnpinIcon /> : <PinIcon />}</span>
          <span className={styles.text}>{isPinned ? t("unpin") : t("pin")}</span>
        </MenuItem>
        {showDetails && (
          <MenuItem component={Link} href={citablePath(hadith, book)} onClick={() => setMoreAnchor(null)}>
            <span className={styles.icon}>
              <EastIcon />
            </span>
            <span className={styles.text}>{t("viewDetails")}</span>
          </MenuItem>
        )}
        <MenuItem component="a" href={reportErrorHref(hadith, book, t)} onClick={() => setMoreAnchor(null)}>
          <span className={styles.icon}>
            <FeedbackIcon />
          </span>
          <span className={styles.text}>{t("reportError")}</span>
        </MenuItem>
      </Menu>

      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        open={Boolean(message)}
        autoHideDuration={2500}
        onClose={() => setMessage(null)}
        message={message || ""}
      />

      {addBookmarkOpen && (
        <AddBookmark open={addBookmarkOpen} closer={handleBookmarkClose} entry={storedHadithRef(hadith, book)} />
      )}
      {removeBookmarkOpen && (
        <RemoveBookmark
          open={removeBookmarkOpen}
          closer={handleBookmarkClose}
          hadith={hadith}
          updateBookmarksData={updateBookmarksData}
          bookmarkKey={bookmarkKey}
          isBookmarkPage={isBookmarkPage}
        />
      )}
      {shareOpen && <Share open={shareOpen} closer={closeShare} url={url} title={`${citation} | Hadith.vn`} />}
    </>
  );
};

export default HadithOptions;
