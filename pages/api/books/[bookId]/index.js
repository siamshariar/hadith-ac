import booksData from '../../../../data/books.json';

export default function handler(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ success: false, error: 'Book ID is required' });
    }

    const bookId = parseInt(id);
    const book = booksData.find(b => b.id === bookId);

    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    res.status(200).json({
      success: true,
      data: book
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}