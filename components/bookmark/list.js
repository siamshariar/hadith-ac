import { useState, useContext } from "react";
import { BookmarkContext } from "../../contexts/BookmarkContext";
import { useRouter } from "next/router";
import FolderIcon from "../icons/Folder";
import CloseIcon from "../icons/Close";
import DeleteBookmark from "./delete";
import styles from "./list.module.scss";

export default function BookmarkList({ controller }) {
  const { bookmarks } = useContext(BookmarkContext);
  const router = useRouter();

  const handleClick = (e, href) => {
    e.preventDefault();
    controller(false)(e);
    router.push(href);
  };

  const [deleteBookmarkOpen, setDeleteBookmarkOpen] = useState(false);
  const [bookmarkKey, setBookmarkKey] = useState("");

  const handleDeleteBookmark = (e, key) => {
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

  return (
    <>
      <div className={styles.content}>
        <div className={styles.lists}>
          {Object.keys(bookmarks).map((key) => (
            <div key={key} className={styles.item}>
              <div
                className={styles.link}
                onClick={(e) => handleClick(e, `/bookmarks?key=${key}`)}
              >
                <div className={styles.left}>
                  <span className={styles.icon}>
                    <FolderIcon />
                  </span>
                  <span className={styles.desc}>
                    <span>{bookmarks[key]["name"]}</span>
                    <span>{bookmarks[key].entry.length} items</span>
                  </span>
                </div>
              </div>

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
      </div>

      <DeleteBookmark
        open={deleteBookmarkOpen}
        closer={handleBookmarkClose}
        bookmarkKey={bookmarkKey}
      />
    </>
  );
}
