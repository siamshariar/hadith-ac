const path = require("path");
const categoriesData = require('../../../data/categories.json');

export default function handler(req, res) {
  try {
    const { type, id, parent_id, page = 1, perPage = 20 } = req.query;

    let filteredCategories = categoriesData;

    // Filter by type
    if (type === 'root') {
      filteredCategories = categoriesData.filter(cat => !cat.parent_id || cat.parent_id === null);
    } else if (type === 'children' && parent_id) {
      filteredCategories = categoriesData.filter(cat => cat.parent_id === parseInt(parent_id));
    }

    // Filter by specific ID
    if (id) {
      const category = categoriesData.find(cat => cat.id === parseInt(id));
      if (!category) {
        return res.status(404).json({ success: false, error: 'Category not found' });
      }
      return res.status(200).json({
        success: true,
        data: category
      });
    }

    // Apply pagination for lists
    const startIndex = (parseInt(page) - 1) * parseInt(perPage);
    const endIndex = startIndex + parseInt(perPage);
    const pagedCategories = filteredCategories.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      data: pagedCategories,
      meta: {
        page: parseInt(page),
        perPage: parseInt(perPage),
        total: filteredCategories.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}