import Link from "next/link";
import { useState, useEffect, useContext } from "react";
import { SettingsContext } from "../../contexts/SettingsContext";
import { getHadithDetailsById } from "../../lib/fetch";
import styles from "./HadithCard.module.scss";

const HadithCard = ({ hadith, bookId, bookName }) => {
  const [expanded, setExpanded] = useState(false);
  const [completeHadith, setCompleteHadith] = useState(hadith);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const { theme } = useContext(SettingsContext);

  // Language names mapping
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
    if (hadith && hadith.id && (!hadith.explanation || !hadith.hints)) {
      getHadithDetailsById(hadith.id, { preferLocal: true }).then((details) => {
        if (details) {
          setCompleteHadith(details);
        }
      }).catch((error) => {
        console.warn('Failed to fetch complete hadith details:', error);
      });
    }
  }, [hadith]);

  const availableTranslations = completeHadith.translations ? 
    Object.entries(completeHadith.translations).filter(([lang, text]) => text && text.trim()) : [];

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const handleCopy = () => {
    const textToCopy = hadith.arabic_text || '';
    navigator.clipboard.writeText(textToCopy);
  };

  const handleBookmark = () => {
    // TODO: Bookmark functionality not yet implemented
  };

  return (
    <div className={`${styles.wrapper} ${theme}`}>
      <div className={styles.header}>
        <div className={styles.breadcrumb}>
          <span className={styles.breadcrumb_icon}>🏠</span>
          <span className={styles.breadcrumb_text}>হোম</span>
          <span className={styles.breadcrumb_separator}>&gt;</span>
          <span className={styles.breadcrumb_text}>{bookName || completeHadith.book?.name_en || 'সহিহ বুখারী'}</span>
          <span className={styles.breadcrumb_separator}>&gt;</span>
          <span className={styles.breadcrumb_text}>{completeHadith.chapter?.name_en || 'অধ্যায়'}</span>
        </div>
      </div>

      {hadith.introduction && (
        <div className={styles.introduction}>
          <div className={styles.intro_content}>
            <div className={styles.intro_number}>১।</div>
            <div className={styles.intro_text}>
              <p>{hadith.introduction}</p>
            </div>
          </div>
        </div>
      )}

      <div className={styles.hadith_header}>
        <div className={styles.hadith_title_section}>
          <div className={styles.book_icon}>📖</div>
          <div className={styles.title_wrapper}>
            <h3 className={styles.book_reference}>
              {bookName || completeHadith.book?.name_en || 'সহিহ বুখারী'}: {completeHadith.hadith_number || '০১'}
            </h3>
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
        </div>

        <div className={styles.action_buttons}>
          <button className={styles.verified_button}>✓ সহিহ হাদিস</button>
          <button className={styles.icon_button} onClick={handleBookmark} title="Bookmark">
            🔖
          </button>
          <button className={styles.icon_button} onClick={handleCopy} title="Copy">
            📋
          </button>
          <button className={styles.icon_button} title="More options">
            ⋯
          </button>
        </div>
      </div>

      {completeHadith.arabic_text && (
        <div className={styles.arabic}>
          <p className={styles.arabic_text}>{completeHadith.arabic_text}</p>
        </div>
      )}
      
      {getCurrentTranslation() && (
        <div className={styles.translation}>
          <div className={styles.translation_header}>
            <span className={styles.language_name}>
              {languageOptions[selectedLanguage] || selectedLanguage.toUpperCase()}
            </span>
          </div>
          <p className={styles.translation_text}>{getCurrentTranslation()}</p>
        </div>
      )}
      
      {expanded && (
        <>
          {/* Additional Information */}
          {completeHadith.explanation && (
            <div className={styles.translation}>
              <div className={styles.translation_header}>
                <span className={styles.language_name}>Explanation</span>
              </div>
              <p className={styles.translation_text}>{completeHadith.explanation}</p>
            </div>
          )}

          {completeHadith.hints && (
            <div className={styles.translation}>
              <div className={styles.translation_header}>
                <span className={styles.language_name}>Hints</span>
              </div>
              <p className={styles.translation_text}>{completeHadith.hints}</p>
            </div>
          )}

          {completeHadith.references && (
            <div className={styles.translation}>
              <div className={styles.translation_header}>
                <span className={styles.language_name}>References</span>
              </div>
              <p className={styles.translation_text}>{completeHadith.references}</p>
            </div>
          )}

          {availableTranslations.length > 1 && (
            <div className={styles.translations}>
              <h4>All Translations</h4>
              {availableTranslations.map(([lang, text]) => (
                <div key={lang} className={`${styles.translation} ${lang === selectedLanguage ? styles.active : ''}`}>
                  <div className={styles.translation_header}>
                    <span className={styles.language_name}>{languageOptions[lang] || lang.toUpperCase()}</span>
                  </div>
                  <p className={styles.translation_text}>{text}</p>
                </div>
              ))}
            </div>
          )}
          
          {availableTranslations.length === 0 && (
            <div className={styles.no_translations}>
              <p>No translations available for this hadith</p>
            </div>
          )}
        </>
      )}
      
      {completeHadith.grade && (
        <div className={styles.grade}>
          <span className={styles.grade_label}>রেটিং:</span>
          <span className={styles.grade_value}>{completeHadith.grade}</span>
        </div>
      )}

      <div className={styles.footer}>
        <button className={styles.expand_button} onClick={toggleExpanded}>
          {expanded ? '▼ লুকান' : '▶ আরও দেখুন'}
        </button>
      </div>
    </div>
  );
};

export default HadithCard;
