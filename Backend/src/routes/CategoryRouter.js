const express = require('express');
const router = express.Router();
const categoryController = require('../controller/CategoryController')
const { authAdminMiddleware } = require('../middleware/authMiddleware');

router.post('/create_category', authAdminMiddleware, categoryController.createCategory)
router.put('/update_category/:id', authAdminMiddleware, categoryController.updateCategory)
router.get('/get_by_id/:id', categoryController.getDetailCategory)
router.get('/get_all', categoryController.getAllCategories)
router.delete('/delete_category/:id', authAdminMiddleware, categoryController.deleteCategory)

module.exports = router
