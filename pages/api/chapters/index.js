import chaptersData from '../../../data/chapters.json';

export default function handler(req, res) {
  try {
    const { book_id } = req.query;

    if (!book_id) {
      return res.status(400).json({ success: false, error: 'book_id parameter is required' });
    }

    const bookChapters = chaptersData[book_id] || [];
    res.status(200).json({
      success: true,
      data: bookChapters
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}