const path = require("path");
const booksData = require('../../../data/books.json');

export default function handler(req, res) {
  try {
    res.status(200).json({
      success: true,
      data: booksData || []
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}