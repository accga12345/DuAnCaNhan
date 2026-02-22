const express = require('express');
const router = express.Router();
const OrderController = require('../controller/OrderController');
const { authMiddleware, authUserMiddleware } = require('../middleware/authMiddleware');

router.post('/create/:id', authUserMiddleware, OrderController.createOrder);
router.get('/get-all', authMiddleware, OrderController.getAllOrder);
router.put('/update/:id', authMiddleware, OrderController.updateOrder);
router.get('/get-details/:id', authUserMiddleware, OrderController.getDetailsOrder);
router.get('/get-all-order/:id', authUserMiddleware, OrderController.getAllOrderDetails);

module.exports = router;
