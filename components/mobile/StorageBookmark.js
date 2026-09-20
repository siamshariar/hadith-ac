"use client";

import { useState, useContext } from "react";
import { BookmarkContext } from "../../contexts/BookmarkContext";
import Link from "next/link";
import FolderIcon from "../icons/Folder";
import CloseIcon from "../icons/Close";
import DeleteBookmark from "../bookmark/delete";
import styles from "../bookmark/list.module.scss";

export default function BookmarkList() {
  const { bookmarks } = useContext(BookmarkContext);
  const [deleteBookmarkOpen, setDeleteBookmarkOpen] = useState(false);
  const [bookmarkKey, setBookmarkKey] = useState("");

  const handleDeleteBookmark = (e, key) => {
    e.preventDefault();
    e.stopPropagation();
    setBookmarkKey(key);
    setDeleteBookmarkOpen(true);
  };

  const handleBookmarkClose = (open) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }
    setDeleteBookmarkOpen(open);
  };

  if (!bookmarks) {
    return (
      <div className={styles.content}>
        <div className={styles.no_record}>No bookmarks found</div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.content}>
        <div className={styles.lists}>
          {Object.keys(bookmarks).map((key) => (
            <div key={key} className={styles.item}>
              <Link href={`/bookmarks?key=${key}`} className={styles.link}>
                <div className={styles.left}>
                  <span className={styles.icon}>
                    <FolderIcon />
                  </span>
                  <span className={styles.desc}>
                    <span>{bookmarks[key]?.name || 'Unnamed Folder'}</span>
                    <span>{bookmarks[key]?.entry?.length || 0} items</span>
                  </span>
                </div>
              </Link>

              {key !== "favorites" && (
                <span
                  className={styles.delete_icon}
                  onClick={(e) => handleDeleteBookmark(e, key)}
                >
                  <CloseIcon />
                </span>
              )}
            </div>
          ))}
        </div>

        {Object.keys(bookmarks).length === 0 && (
          <div className={styles.no_record}>No bookmarks found</div>
        )}
      </div>

      <DeleteBookmark
        open={deleteBookmarkOpen}
        closer={handleBookmarkClose}
        bookmarkKey={bookmarkKey}
      />
    </>
  );
}