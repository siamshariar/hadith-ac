import { useState, useEffect, useContext, useRef } from "react";
import { SettingsContext } from "../../contexts/SettingsContext";
import { PinContext } from "../../contexts/PinContext";
import { getHadithDetailsById, getTranslation, getAvailableLanguages } from "../../lib/fetch";
import { config } from "../../lib/config";
import HadithOptions from "./HadithOptions";
import styles from "./HadithCard.module.scss";

const HadithCard = ({ 
  hadith, 
  bookId, 
  bookName, 
  chapterName, 
  breadcrumbPath, 
  updateBookmarksData, 
  isBookmarkPage, 
  currentPageUrl,
  chapterId,
  categoryId 
}) => {
  const [expanded, setExpanded] = useState(false);
  const [completeHadith, setCompleteHadith] = useState(hadith);
  const [selectedLanguage, setSelectedLanguage] = useState(config.language);
  const [loadingTranslations, setLoadingTranslations] = useState(false);
  const [availableLanguages, setAvailableLanguages] = useState([config.language]);
  const { theme } = useContext(SettingsContext);
  const { pin } = useContext(PinContext);

  const multiTranslationsEnabled = config.enableMultiTranslations;

  const languageOptions = {
    en: 'English',
    vi: 'Tiếng Việt',
    ar: 'العربية',
    ur: 'اردو',
    bn: 'বাংলা',
    tr: 'Türkçe',
    fr: 'Français',
    es: 'Español',
    id: 'Bahasa Indonesia',
    ms: 'Bahasa Melayu',
    bs: 'Bosanski',
    ru: 'Русский',
    fa: 'فارسی',
    hi: 'हिन्दी',
    si: 'සිංහල',
    tl: 'Tagalog',
    zh: '中文'
  };

  const getCurrentTranslation = () => {
    if (!completeHadith?.translations) return '';
    
    if (!multiTranslationsEnabled) {
      const value = completeHadith.translations[config.language] || 
                   completeHadith.translations['en'] || 
                   completeHadith.translations['ar'] || 
                   '';
      return extractTranslationText(value);
    }
    
    const value = completeHadith.translations[selectedLanguage] || 
                 completeHadith.translations['en'] || 
                 completeHadith.translations['ar'] || 
                 '';
    return extractTranslationText(value);
  };

  const extractTranslationText = (translationData) => {
    if (!translationData) return '';
    
    if (typeof translationData === 'string') return translationData;
    
    if (typeof translationData === 'object') {
      return translationData.text || 
             translationData.translation_text || 
             translationData.translation || 
             '';
    }
    
    return String(translationData);
  };

  const cardRef = useRef(null);

  // Load complete hadith data when card is in viewport
  useEffect(() => {
    let mounted = true;
    let observer;
    let fetched = false;

    async function fetchCompleteData() {
      if (!hadith || !hadith.id) return;
      
      try {
        setLoadingTranslations(true);
        
        // Fetch complete hadith details from API only
        const details = await getHadithDetailsById(hadith.id);
        
        if (details && mounted) {
          setCompleteHadith(details);
          
          // Fetch available languages from API
          const langs = await getAvailableLanguages(hadith.id);
          if (langs.length > 0) {
            setAvailableLanguages(langs);
          }
          
          // If multi-translations enabled, load missing translations
          if (multiTranslationsEnabled) {
            const currentTranslations = Object.keys(details.translations || {});
            const missingLanguages = langs.filter(lang => 
              !currentTranslations.includes(lang) && lang !== config.language
            );
            
            if (missingLanguages.length > 0) {
              const translationPromises = missingLanguages.map(async (lang) => {
                const translation = await getTranslation(hadith.id, lang);
                if (translation && translation.text) {
                  return { lang, text: translation.text };
                }
                return null;
              });
              
              const results = await Promise.all(translationPromises);
              
              if (mounted) {
                results.forEach(result => {
                  if (result && result.text) {
                    setCompleteHadith(prev => ({
                      ...prev,
                      translations: {
                        ...prev.translations,
                        [result.lang]: result.text
                      }
                    }));
                  }
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch complete hadith data:', error);
      } finally {
        if (mounted) setLoadingTranslations(false);
      }
    }

    // Use IntersectionObserver for lazy loading
    if (typeof IntersectionObserver === 'undefined') {
      fetchCompleteData();
      return () => { mounted = false; };
    }

    const el = cardRef.current;
    if (!el) return;

    observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !fetched) {
          fetched = true;
          fetchCompleteData();
          if (observer) observer.disconnect();
        }
      });
    }, { rootMargin: '200px' });

    observer.observe(el);

    return () => {
      mounted = false;
      if (observer) observer.disconnect();
    };
  }, [hadith?.id, multiTranslationsEnabled]);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const breadcrumbItems = breadcrumbPath || [];

  return (
    <div ref={cardRef} className={`${styles.wrapper} ${theme}`} id={`hadith-${hadith.hadith_number || hadith.id}`}>
      <div className={styles.header}>
        <div className={styles.breadcrumb}>
          {breadcrumbItems.map((item, index) => (
            <span key={index} className={styles.breadcrumb_segment}>
              {index > 0 && <span className={styles.breadcrumb_separator}>&gt;</span>}
              {item.icon && <span className={styles.breadcrumb_icon}>{item.icon}</span>}
              <span className={styles.breadcrumb_text}>{item.text}</span>
            </span>
          ))}
        </div>
        
        {multiTranslationsEnabled && (
          <div className={styles.language_selector}>
            <select 
              value={selectedLanguage} 
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className={styles.language_select}
              disabled={loadingTranslations}
            >
              {Object.keys(completeHadith?.translations || {}).map(lang => (
                <option key={lang} value={lang}>
                  {languageOptions[lang] || lang.toUpperCase()}
                </option>
              ))}
              {(!completeHadith?.translations || Object.keys(completeHadith.translations).length === 0) && (
                <option value={config.language}>
                  {languageOptions[config.language] || config.language.toUpperCase()}
                </option>
              )}
            </select>
          </div>
        )}
      </div>

      <div className={styles.hadith_header}>
        <div className={styles.hadith_title_section}>
          <div className={styles.book_icon}>📖</div>
          <div className={styles.title_wrapper}>
            <h3 className={styles.book_reference}>
              {bookName || completeHadith.book?.name_en || 'Hadith'}: {completeHadith.hadith_number || 'N/A'}
            </h3>
            {completeHadith.narrator && (
              <div className={styles.narrator}>
                <strong>Narrator:</strong> {completeHadith.narrator}
              </div>
            )}
          </div>
        </div>

        <div className={styles.action_buttons}>
          {completeHadith.grade && (
            <button className={styles.verified_button}>
              {completeHadith.grade}
            </button>
          )}
          <HadithOptions
            updateBookmarksData={updateBookmarksData}
            isBookmarkPage={isBookmarkPage}
            hadith={completeHadith}
            currentPageUrl={currentPageUrl}
            bookId={bookId}
            chapterId={chapterId}
            categoryId={categoryId}
          />
        </div>
      </div>

      {completeHadith.arabic_text && (
        <div className={styles.arabic}>
          <p className={styles.arabic_text}>{completeHadith.arabic_text}</p>
        </div>
      )}
      
      {loadingTranslations && !getCurrentTranslation() ? (
        <div className={styles.translation}>
          <div className={styles.translation_header}>
            <span className={styles.language_name}>
              Loading translation...
            </span>
          </div>
          <p className={styles.translation_text}>Loading...</p>
        </div>
      ) : getCurrentTranslation() ? (
        <div className={styles.translation}>
          <div className={styles.translation_header}>
            <span className={styles.language_name}>
              {multiTranslationsEnabled 
                ? (languageOptions[selectedLanguage] || selectedLanguage.toUpperCase())
                : (languageOptions[config.language] || config.language.toUpperCase())
              }
            </span>
          </div>
          <p className={styles.translation_text}>{getCurrentTranslation()}</p>
        </div>
      ) : null}
      
      {expanded && (
        <>
          {completeHadith.word_meanings && (
            <div className={styles.translation}>
              <div className={styles.translation_header}>
                <span className={styles.language_name}>Word Meanings</span>
              </div>
              <p className={styles.translation_text}>{completeHadith.word_meanings}</p>
            </div>
          )}

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

          {multiTranslationsEnabled && completeHadith.translations && Object.keys(completeHadith.translations).length > 1 && (
            <div className={styles.translations}>
              <h4>All Translations</h4>
              {Object.entries(completeHadith.translations)
                .filter(([lang]) => lang !== selectedLanguage)
                .map(([lang, text]) => (
                  <div key={lang} className={styles.translation}>
                    <div className={styles.translation_header}>
                      <span className={styles.language_name}>
                        {languageOptions[lang] || lang.toUpperCase()}
                      </span>
                    </div>
                    <p className={styles.translation_text}>
                      {extractTranslationText(text)}
                    </p>
                  </div>
                ))
              }
            </div>
          )}
        </>
      )}

      <div className={styles.footer}>
        <button 
          className={`${styles.expand_button} ${expanded ? styles.expanded : ''}`} 
          onClick={toggleExpanded}
          disabled={loadingTranslations}
        >
          <svg className={styles.expand_icon} focusable="false" aria-hidden="true" viewBox="0 0 24 24">
            <path d="M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z"></path>
          </svg>
          <span className={styles.expand_text}>
            {expanded ? 'Hide' : 'Show More'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default HadithCard;