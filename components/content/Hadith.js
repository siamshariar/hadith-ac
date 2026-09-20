"use client";

import HadithCard from "./HadithDetailCard";
import styles from "./Content.module.scss";

const HadithContent = ({ hadith }) => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <div className={styles.card}>
          <HadithCard hadith={hadith} />
        </div>

        <div className={styles.print_footer}>
          <span>Vietnamese Hassan</span>
          <span>www.quran.vn</span>
        </div>
      </div>
    </div>
  );
};

export default HadithContent;
