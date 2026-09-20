const path = require("path");
const hadithsData = require('../../../data/hadiths.json');

export default function handler(req, res) {
  try {
    const { hadith_id } = req.query;

    if (!hadith_id) {
      return res.status(400).json({ success: false, error: 'hadith_id parameter is required' });
    }

    // Find the hadith
    let foundHadith = null;
    for (const [bookKey, bookChapters] of Object.entries(hadithsData)) {
      for (const [chapterKey, hadiths] of Object.entries(bookChapters)) {
        const hadith = hadiths.find(h => h.id === parseInt(hadith_id));
        if (hadith) {
          foundHadith = hadith;
          break;
        }
      }
      if (foundHadith) break;
    }

    if (!foundHadith) {
      return res.status(404).json({ success: false, error: 'Hadith not found' });
    }

    // Extract translations
    const translations = [];
    const languages = ['en', 'vi', 'ar', 'bn', 'ur', 'tr', 'fr', 'es', 'id', 'ms', 'bs', 'ru', 'fa', 'hi', 'si', 'tl', 'zh'];

    languages.forEach(lang => {
      const translationField = `translation_${lang}`;
      const text = foundHadith[translationField] || foundHadith.translation?.[lang];

      if (text) {
        translations.push({
          language: lang,
          localization_code: lang,
          translation_text: text,
          translation: text,
          text: text
        });
      }
    });

    res.status(200).json({
      success: true,
      data: translations
    });
  } catch (error) {
    console.error('Error fetching translations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
