const express = require('express');
const router = express.Router();
const productController = require('../controller/ProductController')
const { authMiddleware, authUserMiddleware } = require('../middleware/authMiddleware');

router.post('/create_product', authMiddleware, productController.createProduct)
router.put('/update_product/:id', authMiddleware, productController.updateProduct)
router.get('/get_by_id/:id', productController.getDetailProduct)
router.get('/get_all', productController.getAllProducts)
router.delete('/delete_product/:id', authMiddleware, productController.deleteProduct)
router.delete('/delete_many_product', authMiddleware, productController.deleteManyProduct)
router.get('/get_all_category_product', productController.getAllCategoryProduct)


module.exports = router