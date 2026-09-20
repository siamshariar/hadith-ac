const path = require("path");
const hadithsData = require('../../../data/hadiths.json');
const booksData = require('../../../data/books.json');
const chaptersData = require('../../../data/chapters.json');
const categoriesData = require('../../../data/categories.json');

export default function handler(req, res) {
  try {
    // Count total hadiths
    let totalHadiths = 0;
    for (const [bookKey, bookChapters] of Object.entries(hadithsData)) {
      for (const [chapterKey, hadiths] of Object.entries(bookChapters)) {
        totalHadiths += hadiths.length;
      }
    }

    // Count total translations (approximate)
    const languages = ['en', 'vi', 'ar', 'bn', 'ur', 'tr', 'fr', 'es', 'id', 'ms', 'bs', 'ru', 'fa', 'hi', 'si', 'tl', 'zh'];
    let totalTranslations = 0;
    for (const [bookKey, bookChapters] of Object.entries(hadithsData)) {
      for (const [chapterKey, hadiths] of Object.entries(bookChapters)) {
        hadiths.forEach(hadith => {
          languages.forEach(lang => {
            const translationField = `translation_${lang}`;
            if (hadith[translationField] || hadith.translation?.[lang]) {
              totalTranslations++;
            }
          });
        });
      }
    }

    // Count chapters
    let totalChapters = 0;
    for (const [bookKey, chapters] of Object.entries(chaptersData)) {
      totalChapters += chapters.length;
    }

    const stats = {
      total_hadiths: totalHadiths,
      total_translations: totalTranslations,
      total_books: booksData.length,
      total_chapters: totalChapters,
      total_categories: categoriesData.length,
      languages_supported: languages.length
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
