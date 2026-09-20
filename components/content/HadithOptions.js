 "use client";

import { useState, useEffect, useContext } from "react";
import { PinContext } from "../../contexts/PinContext";
import { BookmarkContext } from "../../contexts/BookmarkContext";
import { server } from "../../lib/config";
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

const HadithOptions = ({
  // chapterNumber,
  // chapterName,
  // chapterSlug,
  // verseNumber,
  // ayaArabic,
  // translation,
  // footnotes,
  // printRef,
  updateBookmarksData,
  isBookmarkPage,
  hadith,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handlePopoverOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  //snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      // let path = window.location.pathname;
      // let parts = path.split("/");
      let url = `${server}/hadiths/${hadith.id}`;

      // if (parts.length === 3 && parts[1] === "chapters") {
      //   url = `${server}/chapters/${chapterSlug}#verse-${verseNumber}`;
      // } else if (
      //   parts.length === 5 &&
      //   parts[1] === "chapters" &&
      //   parts[3] === "verses"
      // ) {
      //   url = `${server}/chapters/${chapterSlug}/verses/${verseNumber}`;
      // } else {
      //   url = `${server}/chapters/${chapterSlug}/verses/${verseNumber}`;
      // }

      navigator.clipboard.writeText(url);
      handlePopoverClose();
      setSnackbarOpen(true);
    }
  };

  const handleCopyFile = () => {
    if (typeof window !== "undefined") {
      // let path = window.location.pathname;
      // let parts = path.split("/");
      let url = `${server}/hadiths/${hadith.id}`;

      // if (parts.length === 3 && parts[1] === "chapters") {
      //   url = `${server}/chapters/${chapterSlug}#verse-${verseNumber}`;
      // } else if (
      //   parts.length === 5 &&
      //   parts[1] === "chapters" &&
      //   parts[3] === "verses"
      // ) {
      //   url = `${server}/chapters/${chapterSlug}/verses/${verseNumber}`;
      // } else {
      //   url = `${server}/chapters/${chapterSlug}/verses/${verseNumber}`;
      // }

      const translationText = Object.values(hadith.translations || {})[0] || '';
      let file = `Hadith ${hadith.hadith_number || hadith.id}\n\n${hadith.arabic_text || ''}\n\n${translationText}\n\nGrade: ${hadith.grade || ''}\n\n${url}`;

      navigator.clipboard.writeText(file);
      handlePopoverClose();
      setSnackbarOpen(true);
    }
  };

  // share option
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareTitle, setShareTitle] = useState("");

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

    const url = `${server}/hadiths/${hadith.id}`;
    const title =
      "Hadith " +
      (hadith.hadith_number || hadith.id) +
      " | Hadith | Hadith in Vietnamese | hadith.vn";

    setShareUrl(url);
    setShareTitle(title);
    setShareOpen(true);
  };

  const handleMobileShare = () => {
    handlePopoverClose();

    const url = `${server}/hadiths/${hadith.id}`;
    const title =
      "Hadith " +
      (hadith.hadith_number || hadith.id) +
      " | Hadith | Hadith in Vietnamese | hadith.vn";

    if (navigator.share) {
      navigator.share({
        title: title,
        url: url,
      });
    } else {
      setShareUrl(url);
      setShareTitle(title);
      setShareOpen(true);
    }
  };

  // bookmarks
  const { bookmarks } = useContext(BookmarkContext);
  const [isBookmarked, setIsBookmarked] = useState(true);
  const [bookmarkKey, setBookmarkKey] = useState("");

  const checkVerseBookmarked = (arr, id) => {
    return arr.some((el) => {
      return el.id == id;
    });
  };

  useEffect(() => {
    for (let [key, value] of Object.entries(bookmarks)) {
      if (checkVerseBookmarked(value.entry, hadith.id)) {
        setIsBookmarked(true);
        setBookmarkKey(key);
        break;
      } else {
        setIsBookmarked(false);
      }
    }
  }, [bookmarks, anchorEl]);

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
  const checkPinnedThisVerse = (arr, id) => {
    return arr.some((el) => el.id == id);
  };

  const { pin, addPin, removePin } = useContext(PinContext);
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    checkPinnedThisVerse(pin, hadith.id)
      ? setIsPinned(true)
      : setIsPinned(false);
  }, [pin, hadith]);

  const handleAddPin = () => {
    // addPin(chapterNumber, chapterName, chapterSlug, verseNumber);
    addPin(hadith);
    handlePopoverClose();
  };

  const handleRemovePin = () => {
    // removePin(chapterNumber, verseNumber);
    removePin(hadith);
    handlePopoverClose();
  };

  // print option
  const pageStyle = `
    @page {
      size: auto;
      margin: 20mm;
    }
  `;

  // const handlePrint = useReactToPrint({
  //   content: () => printRef,
  //   documentTitle: chapterName,
  //   pageStyle: pageStyle,
  //   onBeforeGetContent: () => handlePopoverClose(),
  //   removeAfterPrint: true,
  // });

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
        message="Đã được copy"
      />

      <Share
        open={shareOpen}
        closer={handleShareClose}
        url={shareUrl}
        title={shareTitle}
      />

      <AddBookmark
        open={addBookmarkOpen}
        closer={handleBookmarkClose}
        hadith={hadith}
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
            aria-label="Hadith options"
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
              <MenuItem
                classes={{
                  root: styles.mobile_share,
                }}
                onClick={() => handleMobileShare()}
              >
                <span className={styles.icon}>
                  <ShareIcon />
                </span>
                <span className={styles.text}>Share</span>
              </MenuItem>

              <MenuItem
                classes={{
                  root: styles.web_share,
                }}
                onClick={() => handleWebShare()}
              >
                <span className={styles.icon}>
                  <ShareIcon />
                </span>
                <span className={styles.text}>Share</span>
              </MenuItem>

              {isBookmarked && (
                <MenuItem onClick={handleRemoveBookmark}>
                  <span className={styles.icon}>
                    <BookmarkIcon />
                  </span>
                  <span className={styles.text}>Remove bookmark</span>
                </MenuItem>
              )}

              {!isBookmarked && (
                <MenuItem onClick={handleAddBookmark}>
                  <span className={styles.icon}>
                    <BookmarkBorder />
                  </span>
                  <span className={styles.text}>Bookmark</span>
                </MenuItem>
              )}

              {!isPinned && (
                <MenuItem onClick={() => handleAddPin()}>
                  <span className={styles.icon}>
                    <PinIcon />
                  </span>
                  <span className={styles.text}>Pin</span>
                </MenuItem>
              )}

              {isPinned && (
                <MenuItem onClick={() => handleRemovePin()}>
                  <span className={styles.icon}>
                    <UnpinIcon />
                  </span>
                  <span className={styles.text}>Unpin</span>
                </MenuItem>
              )}

              <MenuItem onClick={handleCopyFile}>
                <span className={styles.icon}>
                  <FileCopyIcon />
                </span>
                <span className={styles.text}>Copy</span>
              </MenuItem>

              <MenuItem onClick={handleCopyLink}>
                <span className={styles.icon}>
                  <LinkIcon />
                </span>
                <span className={styles.text}>Copy Link</span>
              </MenuItem>

              {/*<MenuItem onClick={handlePrint}>*/}
              {/*  <span className={styles.icon}>*/}
              {/*    <PrintIcon />*/}
              {/*  </span>*/}
              {/*  <span className={styles.text}>Print</span>*/}
              {/*</MenuItem>*/}
            </MenuList>
          </Popover>
        </div>
      </div>
    </>
  );
};

export default HadithOptions;