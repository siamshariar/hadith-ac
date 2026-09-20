const path = require("path");
const hadithsData = require('../../../data/hadiths.json');

export default function handler(req, res) {
  try {
    const languages = ['ar', 'en', 'bn', 'ur', 'id', 'fr', 'tr', 'ru', 'ta', 'es', 'pt', 'fa', 'hi', 'de', 'it', 'ms', 'bs', 'zh', 'ja', 'vi', 'tl', 'si', 'ug', 'ha', 'ku', 'sw'];
    const languageStats = {};

    // Initialize stats
    languages.forEach(lang => {
      languageStats[lang] = {
        code: lang,
        name: getLanguageName(lang),
        translations: 0,
        coverage_percentage: 0
      };
    });

    // Count translations for each language
    let totalHadiths = 0;
    for (const [bookKey, bookChapters] of Object.entries(hadithsData)) {
      for (const [chapterKey, hadiths] of Object.entries(bookChapters)) {
        hadiths.forEach(hadith => {
          totalHadiths++;
          languages.forEach(lang => {
            const translationField = `translation_${lang}`;
            if (hadith[translationField] || hadith.translation?.[lang]) {
              languageStats[lang].translations++;
            }
          });
        });
      }
    }

    // Calculate coverage percentages
    languages.forEach(lang => {
      languageStats[lang].coverage_percentage = totalHadiths > 0
        ? Math.round((languageStats[lang].translations / totalHadiths) * 10000) / 100
        : 0;
    });

    // Convert to array and sort by coverage
    const statsArray = Object.values(languageStats).sort((a, b) => b.coverage_percentage - a.coverage_percentage);

    res.status(200).json({
      success: true,
      data: statsArray
    });
  } catch (error) {
    console.error('Error fetching language stats:', error);
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
