const path = require("path");
const hadithsData = require('../../../data/hadiths.json');
const booksData = require('../../../data/books.json');
const chaptersData = require('../../../data/chapters.json');

export default function handler(req, res) {
  try {
    const { chapter_id, limit = 1 } = req.query;

    if (!chapter_id) {
      return res.status(400).json({ success: false, error: 'chapter_id parameter is required' });
    }

    // Find the hadiths for this chapter
    let foundHadiths = [];
    let foundBook = null;
    let foundChapter = null;

    for (const [bookKey, bookChapters] of Object.entries(hadithsData)) {
      for (const [chapterKey, hadiths] of Object.entries(bookChapters)) {
        if (parseInt(chapterKey) === parseInt(chapter_id)) {
          foundHadiths = hadiths.slice(0, parseInt(limit));
          foundBook = booksData.find(b => b.id === parseInt(bookKey));
          foundChapter = chaptersData[bookKey]?.find(c => c.id === parseInt(chapterKey));
          break;
        }
      }
      if (foundHadiths.length > 0) break;
    }

    if (foundHadiths.length === 0) {
      return res.status(404).json({ success: false, error: 'Chapter not found or no hadiths available' });
    }

    // Format hadiths with enhanced metadata
    const formattedHadiths = foundHadiths.map(hadith => {
      const translations = {};
      const languages = ['en', 'vi', 'ar', 'bn', 'ur', 'tr', 'fr', 'es', 'id', 'ms', 'bs', 'ru', 'fa', 'hi', 'si', 'tl', 'zh'];

      languages.forEach(lang => {
        const translationField = `translation_${lang}`;
        const text = hadith[translationField] || hadith.translation?.[lang];

        if (text) {
          translations[lang] = {
            language_code: lang,
            language_name: getLanguageName(lang),
            native_name: getNativeName(lang),
            direction: getDirection(lang),
            text: text
          };
        }
      });

      return {
        id: hadith.id,
        book_id: foundBook?.id,
        chapter_id: parseInt(chapter_id),
        hadith_number: hadith.hadith_number || hadith.number || hadith.id,
        arabic_text: hadith.arabic_text || hadith.text_ar || hadith.text || '',
        grade: hadith.grade || '',
        created_at: hadith.created_at || new Date().toISOString(),
        book_name: foundBook?.name_en || '',
        book_name_ar: foundBook?.name_ar || '',
        book_code: foundBook?.code || '',
        chapter_name: foundChapter?.name_en || '',
        chapter_name_ar: foundChapter?.name_ar || '',
        translations: translations
      };
    });

    res.status(200).json({
      success: true,
      data: formattedHadiths
    });
  } catch (error) {
    console.error('Error fetching hadiths with metadata:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

function getLanguageName(code) {
  const names = {
    ar: 'Arabic', en: 'English', bn: 'Bengali', ur: 'Urdu', id: 'Indonesian',
    fr: 'French', tr: 'Turkish', ru: 'Russian', ta: 'Tamil', es: 'Spanish',
    pt: 'Portuguese', fa: 'Persian', hi: 'Hindi', de: 'German', it: 'Italian',
    ms: 'Malay', bs: 'Bosnian', zh: 'Chinese', ja: 'Japanese', vi: 'Vietnamese',
    tl: 'Tagalog', si: 'Sinhalese', ug: 'Uyghur', ha: 'Hausa', ku: 'Kurdish', sw: 'Swahili'
  };
  return names[code] || code;
}

function getNativeName(code) {
  const natives = {
    ar: 'العربية', en: 'English', bn: 'বাংলা', ur: 'اردو', id: 'Bahasa Indonesia',
    fr: 'Français', tr: 'Türkçe', ru: 'Русский', ta: 'தமிழ்', es: 'Español',
    pt: 'Português', fa: 'فارسی', hi: 'हिन्दी', de: 'Deutsch', it: 'Italiano',
    ms: 'Bahasa Melayu', bs: 'Bosanski', zh: '中文', ja: '日本語', vi: 'Tiếng Việt',
    tl: 'Tagalog', si: 'සිංහල', ug: 'ئۇيغۇرچە', ha: 'Hausa', ku: 'کوردی', sw: 'Kiswahili'
  };
  return natives[code] || code;
}

function getDirection(code) {
  const rtl = ['ar', 'ur', 'fa', 'ug', 'ku'];
  return rtl.includes(code) ? 'rtl' : 'ltr';
}
