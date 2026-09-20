import { useContext } from "react";
import { PinContext } from "../../contexts/PinContext";
import { useRouter } from "next/router";
import PinIcon from "../icons/Pin";
import styles from "../pin/list.module.scss";

export default function PinList() {
  const { pin } = useContext(PinContext);
  const router = useRouter();

  const handlePinClick = (e, item) => {
    e.preventDefault();

    // Priority 1: Use the stored source_url if available and it's not a hadith detail page
    if (item.source_url && !item.source_url.includes('/hadiths/')) {
      router.push(item.source_url);
      return;
    }

    // Priority 2: Build URL from book/chapter context
    if (item.book_id && item.chapter_id) {
      // Navigate to book chapter page with hadith anchor
      const url = `/books/${item.book_id}/chapters/${item.chapter_id}#hadith-${item.hadith_number || item.id}`;
      router.push(url);
      return;
    } else if (item.book_id) {
      // Navigate to book page with hadith anchor
      const url = `/books/${item.book_id}#hadith-${item.hadith_number || item.id}`;
      router.push(url);
      return;
    } else if (item.category_id) {
      // Navigate to category page with hadith anchor
      const url = `/categories/${item.category_id}#hadith-${item.id}`;
      router.push(url);
      return;
    }

    // Priority 3: Fallback to hadith detail page (should be rare)
    const url = `/hadiths/${item.id}`;
    router.push(url);
  };

  // Function to get display title
  const getDisplayTitle = (item) => {
    if (item.title) return item.title;
    if (item.hadeeth) {
      return item.hadeeth.length > 100 
        ? item.hadeeth.substring(0, 100) + '...' 
        : item.hadeeth;
    }
    if (item.arabic_text) {
      return item.arabic_text.length > 100 
        ? item.arabic_text.substring(0, 100) + '...' 
        : item.arabic_text;
    }
    return 'Hadith ' + (item.hadith_number || item.id);
  };

  // Function to get source info for display
  const getSourceInfo = (item) => {
    if (item.book_name && item.hadith_number) {
      return `${item.book_name} • Hadith ${item.hadith_number}`;
    }
    if (item.book_name) {
      return item.book_name;
    }
    if (item.chapter_name) {
      return item.chapter_name;
    }
    if (item.category_name) {
      return item.category_name;
    }
    return 'Hadith';
  };

  // Function to get source URL for display
  const getSourceUrlDisplay = (item) => {
    if (item.source_url) {
      return `From: ${item.source_url}`;
    }
    if (item.book_id && item.chapter_id) {
      return `From: /books/${item.book_id}/chapters/${item.chapter_id}`;
    }
    return 'Source: Unknown';
  };

  return (
    <div className={styles.content}>
      <div className={styles.lists}>
        {pin && pin.length > 0 ? (
          pin.map((item) => (
            <div key={item.id} className={styles.item}>
              <div
                className={styles.link}
                onClick={(e) => handlePinClick(e, item)}
              >
                <div className={styles.left}>
                  <span className={styles.icon}>
                    <PinIcon />
                  </span>
                  <span className={styles.desc}>
                    <span className={styles.hadith_title}>{getDisplayTitle(item)}</span>
                    <span className={styles.source_info}>{getSourceInfo(item)}</span>
                    <span className={styles.source_url}>{getSourceUrlDisplay(item)}</span>
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <h2 className={styles.no_record}>No pinned hadiths found!</h2>
        )}
      </div>
    </div>
  );
}