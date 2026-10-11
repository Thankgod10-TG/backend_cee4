const express = require('express');
const router = express.Router();

const {
  createProduct,
  getProducts,
  getProductById,
  getMyProducts,
  getProductsByVendor,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');

const authMiddleware = require('../middleware/authMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');

router.get('/', getProducts);
router.get('/vendor/:id', getProductsByVendor);

router.get('/mine', authMiddleware, getMyProducts);

router.post("/", authMiddleware, uploadMiddleware.array('images', 5), createProduct);

router.put("/:id", authMiddleware, updateProduct);

router.delete("/:id", authMiddleware, deleteProduct);

router.get("/:id", getProductById);

module.exports = router;



