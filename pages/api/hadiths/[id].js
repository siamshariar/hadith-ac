const path = require("path");
const hadithsData = require('../../../data/hadiths.json');
const booksData = require('../../../data/books.json');
const chaptersData = require('../../../data/chapters.json');
const categoriesData = require('../../../data/categories.json');

function getLocalizedCategoryName(category, lang) {
  if (!category) return '';
  
  const nameMap = {
    'en': category.name_en,
    'ar': category.name_ar,
    'bn': category.name_bn,
    'ur': category.name_ur,
    'fr': category.name_fr
  };
  
  return nameMap[lang] || category.name_en || category.name_ar || '';
}

export default function handler(req, res) {
  const { id } = req.query;
  const lang = req.query.language || 'en';

  try {
    // Search through all hadiths to find by ID
    let foundHadith = null;
    let foundBook = null;
    let foundChapter = null;
    let foundCategories = [];

    for (const [bookKey, bookChapters] of Object.entries(hadithsData)) {
      for (const [chapterKey, hadiths] of Object.entries(bookChapters)) {
        const hadith = hadiths.find(h => h.id === parseInt(id));
        if (hadith) {
          foundHadith = hadith;
          foundBook = booksData.find(b => b.id === parseInt(bookKey));
          foundChapter = chaptersData[bookKey]?.find(c => c.id === parseInt(chapterKey));
          
          // Find relevant categories
          foundCategories = categoriesData.filter(cat => 
            cat.id === foundChapter?.id || 
            cat.name_en?.toLowerCase().includes('faith') || 
            cat.name_en?.toLowerCase().includes('prayer') ||
            cat.name_en?.toLowerCase().includes('morals')
          ).slice(0, 3);
          
          break;
        }
      }
      if (foundHadith) break;
    }

    if (!foundHadith) {
      return res.status(404).json({ success: false, error: 'Hadith not found' });
    }

    // Get translation for requested language
    const translation = foundHadith.translations?.[lang] || foundHadith.translations?.['en'] || '';

    const formattedHadith = {
      id: foundHadith.id,
      title: foundHadith.translations?.['en'] || `Hadith ${foundHadith.hadith_number}`,
      hadeeth: translation,
      arabic_text: foundHadith.hadeeth,
      attribution: foundBook ? foundBook.name_en || foundBook.title : '',
      grade: foundHadith.grade,
      explanation: foundHadith.explanation || null,
      hints: foundHadith.hints || null,
      references: foundHadith.references || null,
      narrator: foundHadith.narrator || null,
      categories: foundCategories.map(cat => ({
        id: cat.id,
        name_en: cat.name_en,
        name_ar: cat.name_ar,
        name_localized: getLocalizedCategoryName(cat, lang),
        parent_id: cat.parent_id,
        hadith_count: cat.hadith_count || 0
      })),
      translations: foundHadith.translations,
      book: foundBook ? {
        id: foundBook.id,
        code: foundBook.code || `book${foundBook.id}`,
        name_en: foundBook.name_en || foundBook.title,
        name_ar: foundBook.name_ar || '',
        total_hadiths: foundBook.total_hadiths || 0,
        description: foundBook.description || ''
      } : null,
      chapter: foundChapter ? {
        id: foundChapter.id,
        chapter_no: foundChapter.id,
        name_en: foundChapter.chapter_title || foundChapter.title,
        name_ar: foundChapter.name_ar || '',
        hadith_count: foundChapter.hadith_count || 0
      } : null,
      book_id: foundBook?.id || null,
      chapter_id: foundChapter?.id || null,
      hadith_number: foundHadith.hadith_number,
      language: lang
    };

    res.status(200).json({
      success: true,
      data: formattedHadith
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}