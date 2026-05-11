const express = require('express');
const router = express.Router();
const categoryController = require('../controller/CategoryController')
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/create_category', authMiddleware, categoryController.createCategory)
router.put('/update_category/:id', authMiddleware, categoryController.updateCategory)
router.get('/get_by_id/:id', categoryController.getDetailCategory)
router.get('/get_all', categoryController.getAllCategories)
router.delete('/delete_category/:id', authMiddleware, categoryController.deleteCategory)

module.exports = router
