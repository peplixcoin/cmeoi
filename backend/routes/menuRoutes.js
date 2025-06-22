const express = require('express');
const menuController = require('../controllers/menuController');

const router = express.Router();

router.get('/menu/categories', menuController.getCategories);
router.get('/menu/subcategories', menuController.getSubCategories);
router.get('/menu/items', menuController.getMenuItems);

module.exports = router;