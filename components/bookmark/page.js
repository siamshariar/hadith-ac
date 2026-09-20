import { useContext } from "react";
import { BookmarkContext } from "../../contexts/BookmarkContext";
import HadithCard from "../content/HadithListCard";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import styles from "./page.module.scss";

export default function BookmarkContent({
  name,
  data,
  exist,
  isBookmarkPage,
  queryKey,
  updateBookmarksData,
}) {
  const { bookmarks } = useContext(BookmarkContext);

  // Check if the bookmark folder exists
  const folderExists = bookmarks && bookmarks.hasOwnProperty(queryKey);

  return (
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <div className={styles.title}>
          {name && <span className={styles.title_text}>{name}</span>}
          {!name && <Skeleton height={29} width="100%" />}
        </div>

        {folderExists && data && data.length > 0 ? (
          <div className={styles.items}>
            {data.map((item) => (
              <div className={styles.item} key={item.id}>
                <HadithCard
                  hadith={item}
                  isBookmarkPage={isBookmarkPage}
                  updateBookmarksData={updateBookmarksData}
                />
              </div>
            ))}
          </div>
        ) : folderExists && data && data.length === 0 ? (
          <div className={styles.no_record}>No bookmarks found in this folder!</div>
        ) : !folderExists ? (
          <div className={styles.no_record}>Bookmark folder not found!</div>
        ) : (
          <Skeleton height={150} width="100%" count={2} />
        )}
      </div>
    </div>
  );
}