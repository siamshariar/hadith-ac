const path = require("path");
const hadithsData = require('../../../data/hadiths.json');

export default function handler(req, res) {
  try {
    const { chapter_id, page = 1, limit = 50 } = req.query;

    if (!chapter_id) {
      return res.status(400).json({ success: false, error: 'chapter_id parameter is required' });
    }

    // Find the book that contains this chapter
    let foundHadiths = [];
    let foundBook = null;

    for (const [bookKey, bookChapters] of Object.entries(hadithsData)) {
      for (const [chapterKey, hadiths] of Object.entries(bookChapters)) {
        if (parseInt(chapterKey) === parseInt(chapter_id)) {
          foundHadiths = hadiths;
          foundBook = { id: parseInt(bookKey) };
          break;
        }
      }
      if (foundHadiths.length > 0) break;
    }

    if (foundHadiths.length === 0) {
      return res.status(404).json({ success: false, error: 'Chapter not found' });
    }

    // Apply pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedHadiths = foundHadiths.slice(startIndex, endIndex);

    // Format hadiths with required fields
    const formattedHadiths = paginatedHadiths.map(hadith => ({
      id: hadith.id,
      book_id: foundBook.id,
      chapter_id: parseInt(chapter_id),
      hadith_number: hadith.hadith_number || hadith.number || hadith.id,
      arabic_text: hadith.arabic_text || hadith.text_ar || hadith.text || '',
      grade: hadith.grade || '',
      narrator: hadith.narrator || '',
      explanation: hadith.explanation || '',
      hints: hadith.hints || [],
      references: hadith.references || [],
      word_meanings: hadith.word_meanings || [],
      translations: hadith.translations || {},
      book: foundBook,
      chapter: { id: parseInt(chapter_id) },
      created_at: hadith.created_at || new Date().toISOString(),
      updated_at: hadith.updated_at || new Date().toISOString()
    }));

    res.status(200).json({
      success: true,
      data: formattedHadiths
    });
  } catch (error) {
    console.error('Error fetching hadiths:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}