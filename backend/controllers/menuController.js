const Menu = require('../models/Menu');

// Get distinct categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Menu.distinct("item_cty");
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get subcategories for a category
exports.getSubCategories = async (req, res) => {
  try {
    const category = req.query.category;
    if (!category) {
      return res.status(400).json({ message: "Category parameter is required" });
    }
    const subCategories = await Menu.distinct("item_subcty", { item_cty: category });
    res.status(200).json(subCategories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get menu items by category and subcategory
exports.getMenuItems = async (req, res) => {
  try {
    const { category, subcategory } = req.query;
    if (!category || !subcategory) {
      return res.status(400).json({ 
        message: "Both category and subcategory parameters are required" 
      });
    }
    const menuItems = await Menu.find({ 
      item_cty: category,
      item_subcty: subcategory 
    });
    res.status(200).json(menuItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};