const express = require('express');
const router = express.Router();
const OrderController = require('../controller/OrderController');
const { authMiddleware, authUserMiddleware, authAdminMiddleware } = require('../middleware/authMiddleware');


router.post('/create/:id', authUserMiddleware, OrderController.createOrder);
router.get('/get-all', authMiddleware, OrderController.getAllOrder);
router.put('/update/:id', authMiddleware, OrderController.updateOrder);
router.get('/get-details/:id', authUserMiddleware, OrderController.getDetailsOrder);
router.get('/get-all-order/:id', authUserMiddleware, OrderController.getAllOrderDetails);
router.put('/update-review/:id', authUserMiddleware, OrderController.updateOrderReview);
router.get('/get-warranty/:search', OrderController.getWarranty);

router.delete('/delete_many_order', authAdminMiddleware, OrderController.deleteManyOrder);

module.exports = router;