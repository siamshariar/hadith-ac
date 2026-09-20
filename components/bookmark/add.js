"use client";

import { useState, useContext } from "react";
import { BookmarkContext } from "../../contexts/BookmarkContext";
import Modal from "@mui/material/Modal";
import Backdrop from "@mui/material/Backdrop";
import Fade from "@mui/material/Fade";
import CloseIcon from "../icons/Close";
import styles from "./modal.module.scss";

export default function AddBookmark({ open, closer, hadith }) {
  const { bookmarks, changeBookmarks } = useContext(BookmarkContext);

  const [folderKey, setFolderKey] = useState("favorites");
  const [newFolderKey, setNewFolderKey] = useState("");
  const [newFolderName, setNewFolderName] = useState("");

  const [message, setMessage] = useState({
    open: false,
    text: "",
  });

  const handleShowMessage = (msg) => {
    setMessage({ ...message, ["open"]: true, ["text"]: msg });
    setTimeout(() => {
      setMessage({ ...message, ["open"]: false, ["text"]: msg });
    }, 2000);
    return;
  };

  const handleClose = (e) => {
    closer(false)(e);
    setNewFolderKey("");
    setNewFolderName("");
  };

  const changeFolder = (folder) => {
    setFolderKey(folder);
  };

  const handleCreateNewFolder = (folder) => {
    setNewFolderKey(folder.replace(/\s+/g, "").trim().toLowerCase());
    setNewFolderName(folder.charAt(0).toUpperCase() + folder.slice(1));
  };

  const handleAddBookmark = (e) => {
    let newBookmarks = bookmarks;

    if (folderKey === "create") {
      if (newFolderKey === "") {
        handleShowMessage("Folder name must not be empty!");
      } else if (bookmarks.hasOwnProperty(newFolderKey)) {
        handleShowMessage(newFolderName + " is already exists!");
      } else {
        newBookmarks[newFolderKey] = {
          name: newFolderName,
          entry: [
            {
              id: hadith.id,
              hadith_number: hadith.hadith_number,
              book_id: hadith.book_id,
              chapter_id: hadith.chapter_id,
              arabic_text: hadith.arabic_text,
              translations: hadith.translations,
              book: hadith.book,
              chapter: hadith.chapter,
              narrator: hadith.narrator,
              grade: hadith.grade,
              explanation: hadith.explanation,
              categories: hadith.categories,
            },
          ],
        };

        changeBookmarks(newBookmarks);
        closer(false)(e);
        setFolderKey("favorites");
      }
    } else {
      if (bookmarks.hasOwnProperty(folderKey)) {
        let entry = bookmarks[folderKey].entry;
        entry.push({
          id: hadith.id,
          hadith_number: hadith.hadith_number,
          book_id: hadith.book_id,
          chapter_id: hadith.chapter_id,
          arabic_text: hadith.arabic_text,
          translations: hadith.translations,
          book: hadith.book,
          chapter: hadith.chapter,
          narrator: hadith.narrator,
          grade: hadith.grade,
          explanation: hadith.explanation,
          categories: hadith.categories,
        });
        newBookmarks[folderKey] = {
          name: bookmarks[folderKey].name,
          entry: entry,
        };

        changeBookmarks(newBookmarks);
        closer(false)(e);
      }
    }
  };

  return (
    <Modal
      //className={classes.modal}
      open={open}
      onClose={handleClose}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500,
      }}
    >
      <Fade in={open} timeout={250}>
        <div className={styles.content}>
          <button className={styles.close} onClick={handleClose}>
            <CloseIcon />
          </button>
          <h2 className={styles.title}>Bookmark this hadith</h2>
          <div className={styles.input_area}>
            <h2 className={styles.sub_title}>Choose Folder</h2>
            <select
              value={folderKey}
              onChange={(e) => changeFolder(e.target.value)}
            >
              {Object.keys(bookmarks).map((key) => (
                <option value={key} key={key}>
                  {bookmarks[key].name}
                </option>
              ))}
              <option value="create">Create New Folder</option>
            </select>
            <input
              type="text"
              name="create"
              placeholder="Folder name"
              onChange={(e) => handleCreateNewFolder(e.target.value)}
              className={folderKey === "create" ? styles.open : ""}
            />

            <div
              className={
                message.open
                  ? `${styles.message} ${styles.open}`
                  : styles.message
              }
            >
              {message.text}
            </div>

            <div className={styles.buttons}>
              <button
                className={`${styles.btn} ${styles.btn_add}`}
                onClick={handleAddBookmark}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </Fade>
    </Modal>
  );
}
