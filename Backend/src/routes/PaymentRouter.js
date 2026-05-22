const express = require('express');
const router = express.Router();
const { authMiddleware, authUserMiddleware } = require('../middleware/authMiddleware');
const PaymentController = require('../controller/PaymentController');

router.get('/config', (req, res) => {
    return res.status(200).json({
        status: 'success',
        data: process.env.CLIENT_ID
    })
});

// Cho phép người dùng đã đăng nhập (có token) gọi route này
router.post('/sepay', PaymentController.createSePayPayment);
router.post('/sepay-callback', PaymentController.handleSePayCallback);

module.exports = router;