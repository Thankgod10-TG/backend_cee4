const express = require('express');
const router = express.Router();

const { createCategory, getCategories } = require('../controllers/categoryController');

const authMiddleware = require('../middleware/authMiddleware');

router.get('/', getCategories);
router.post('/', authMiddleware, createCategory);
module.exports = router;