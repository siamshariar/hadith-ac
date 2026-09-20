import { useContext } from "react";
import { PinContext } from "../../contexts/PinContext";
// import { SettingsContext } from "../../contexts/SettingsContext";
import Link from "next/link";
import AutoStoriesIcon from "../icons/AutoStories";
import styles from "../pin/list.module.scss";

export default function LastReadList() {
  const { lastRead } = useContext(PinContext);
  // const { verseMode } = useContext(SettingsContext);

  const formatDate = (date) => {
    const lastReadDate = new Date(date);
    const currentDate = new Date();
    const lastReadDay = lastReadDate.getDate();
    const currentDay = currentDate.getDate();

    let options, formatted;

    if (lastReadDay == currentDay) {
      options = {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      };
    } else {
      options = {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour12: true,
      };
    }
    formatted = lastReadDate.toLocaleString("en-US", options);
    return formatted;
  };

  return (
    <div className={styles.content}>
      <div className={styles.lists}>
        {lastRead &&
          lastRead.length > 0 &&
          lastRead.map((item) => (
            <div key={item.id} className={styles.item}>
              <Link href={`hadiths/${item.id}`} className={styles.link}>

                <span className={styles.left}>
                  <span className={styles.icon}>
                    <AutoStoriesIcon />
                  </span>
                  <span className={styles.desc}>
                    <span>{item.title}</span>
                    <span className={styles.time}>
                      {formatDate(item.date)}
                    </span>
                  </span>
                </span>
                {/* <span className={styles.right}>
                  <span className={styles.time}>{formatDate(item.date)}</span>
                </span> */}

              </Link>
            </div>
          ))}
      </div>
      {lastRead && lastRead.length == 0 && (
        <h2 className={styles.no_record}>No records found!</h2>
      )}
    </div>
  );
}
