import chaptersData from '../../../../data/chapters.json';

export default function handler(req, res) {
  const { bookId } = req.query;

  try {
    const bookChapters = chaptersData[bookId] || [];
    res.status(200).json({
      success: true,
      data: bookChapters
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}