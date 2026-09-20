"use client";

import { useState, useEffect, useContext, useRef } from "react";
import { SettingsContext } from "../../contexts/SettingsContext";
import { PinContext } from "../../contexts/PinContext";
import Link from "next/link";
import useOnScreen from "../../hooks/useOnScreen";
import HadithOptions from "./HadithOptions";
import { getHadithDetailsById } from "../../lib/fetch";
import styles from "./HadithDetailCard.module.scss";

const HadithCard = ({ hadith, updateBookmarksData, isBookmarkPage }) => {
  const [completeHadith, setCompleteHadith] = useState(hadith);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const { theme } = useContext(SettingsContext);

  // Language options with display names
  const languageOptions = {
    en: 'English',
    vi: 'Tiếng Việt',
    ar: 'العربية',
    ur: 'اردو',
    bn: 'বাংলা',
    tr: 'Türkçe',
    fr: 'Français',
    de: 'Deutsch',
    es: 'Español',
    id: 'Bahasa Indonesia',
    hi: 'हिन्दी',
    fa: 'فارسی',
    ru: 'Русский',
    zh: '中文'
  };

  // Get current translation based on selected language
  const getCurrentTranslation = () => {
    if (!completeHadith?.translations) return '';
    return completeHadith.translations[selectedLanguage] || completeHadith.translations['en'] || '';
  };

  // Get available languages for this hadith
  const getAvailableLanguages = () => {
    if (!completeHadith?.translations) return ['en'];
    return Object.keys(completeHadith.translations).filter(lang => completeHadith.translations[lang]);
  };

  // Fetch complete hadith details if needed
  useEffect(() => {
    if (hadith && hadith.id && (!hadith.image || !hadith.explanation)) {
      getHadithDetailsById(hadith.id, { preferLocal: true }).then((details) => {
        if (details) {
          setCompleteHadith(details);
        }
      }).catch((error) => {
        console.warn('Failed to fetch complete hadith details:', error);
      });
    }
  }, [hadith]);

  // Handle null hadith
  if (!completeHadith) {
    return (
      <div className={`${styles.wrapper} custom_font`}>
        <div className={styles.title_area}>
          <div className={styles.left}>
            <h1>Loading...</h1>
          </div>
        </div>
      </div>
    );
  }

  // last read option
  const refTarget = useRef();
  const isTargetVisible = useOnScreen(refTarget);
  const { addLastRead } = useContext(PinContext);

  useEffect(() => {
    if (isTargetVisible) {
      addLastRead(completeHadith);
    }
  }, [isTargetVisible]);

  // Format categories for display
  const formatCategories = () => {
    if (!completeHadith.categories || completeHadith.categories.length === 0) return null;
    
    return completeHadith.categories.map(c => c.name_en || c.name).join(', ');
  };

  return (
    <div className={`${styles.wrapper} custom_font ${theme}`} ref={refTarget}>
      <div className={styles.title_area}>
        <div className={styles.left}>
          <h1>{completeHadith.title || "Hadith"}</h1>
          <div className={styles.language_selector}>
            <select 
              value={selectedLanguage} 
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className={styles.language_select}
            >
              {getAvailableLanguages().map(lang => (
                <option key={lang} value={lang}>
                  {languageOptions[lang] || lang.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className={styles.right}>
          <HadithOptions
            updateBookmarksData={updateBookmarksData}
            isBookmarkPage={isBookmarkPage}
            hadith={completeHadith}
          />
        </div>
      </div>

      <div className={styles.content}>
        {/* Image Section */}
        {completeHadith.image && (
          <div className={`${styles.item} ${styles.image}`}>
            <img src={completeHadith.image} alt={completeHadith.title || "Hadith"} />
          </div>
        )}

        {/* Arabic Text Section */}
        {completeHadith.arabic_text && (
          <div className={`${styles.item} ${styles.arabic}`}>
            <div className={styles.label}>Arabic Text</div>
            <div className={styles.text} dir="rtl">
              {completeHadith.arabic_text}
            </div>
          </div>
        )}

        {/* Translation Section */}
        {getCurrentTranslation() && (
          <div className={`${styles.item} ${styles.trans}`}>
            <div className={styles.label}>
              Translation ({languageOptions[selectedLanguage] || selectedLanguage.toUpperCase()})
            </div>
            <div className={styles.text}>
              {getCurrentTranslation()}
            </div>
          </div>
        )}

        {/* Attribution Section */}
        {completeHadith.attribution && (
          <div className={`${styles.item} ${styles.attr}`}>
            <div className={styles.label}>Book</div>
            <div className={styles.text}>
              {completeHadith.attribution}
            </div>
          </div>
        )}

        {/* Hadith Number */}
        {completeHadith.hadith_number && (
          <div className={`${styles.item} ${styles.number}`}>
            <div className={styles.label}>Hadith Number</div>
            <div className={styles.text}>
              {completeHadith.hadith_number}
            </div>
          </div>
        )}

        {/* Grade Section */}
        {completeHadith.grade && (
          <div className={`${styles.item} ${styles.grade}`}>
            <div className={styles.label}>Grade</div>
            <div className={styles.text}>
              {completeHadith.grade}
            </div>
          </div>
        )}

        {/* Explanation Section */}
        {completeHadith.explanation && (
          <div className={`${styles.item} ${styles.exp}`}>
            <div className={styles.label}>Explanation</div>
            <div className={styles.text}>
              {completeHadith.explanation}
            </div>
          </div>
        )}

        {/* Hints Section */}
        {completeHadith.hints && (
          <div className={`${styles.item} ${styles.hints}`}>
            <div className={styles.label}>Hints</div>
            <div className={styles.text}>
              {completeHadith.hints}
            </div>
          </div>
        )}

        {/* References Section */}
        {completeHadith.references && (
          <div className={`${styles.item} ${styles.references}`}>
            <div className={styles.label}>References</div>
            <div className={styles.text}>
              {completeHadith.references}
            </div>
          </div>
        )}

        {/* Categories Section */}
        {completeHadith.categories && completeHadith.categories.length > 0 && (
          <div className={`${styles.item} ${styles.cat}`}>
            <div className={styles.label}>Categories</div>
            <div className={styles.text}>
              {formatCategories()}
            </div>
          </div>
        )}

        {/* All Translations Section */}
        {completeHadith.translations && Object.keys(completeHadith.translations).length > 1 && (
          <div className={`${styles.item} ${styles.translations}`}>
            <div className={styles.label}>All Translations</div>
            <div className={styles.translations_list}>
              {Object.entries(completeHadith.translations).map(([lang, text]) => (
                text ? (
                  <div key={lang} className={`${styles.translation_item} ${lang === selectedLanguage ? styles.active : ''}`}>
                    <span className={styles.lang_code}>{languageOptions[lang] || lang.toUpperCase()}:</span>
                    <span className={styles.translation_text}>{text}</span>
                  </div>
                ) : null
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HadithCard;