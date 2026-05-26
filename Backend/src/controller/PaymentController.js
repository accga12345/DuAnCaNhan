const SePayService = require('../services/SePayService');
const Order = require('../models/OrderProductModel');

const createSePayPayment = async (req, res) => {
    try {
        const { amount, orderCode } = req.body;
        if (!amount || !orderCode) {
            return res.status(400).json({
                status: 'error',
                message: 'Thiếu số tiền hoặc mã đơn hàng'
            });
        }
        const data = await SePayService.createPaymentUrl(amount, orderCode);
        return res.status(200).json({
            status: 'success',
            data
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

const handleSePayCallback = async (req, res) => {
    try {
        const { content, order_invoice_number } = req.body;
        const rawContent = order_invoice_number || content || "";
        const regex = /DH\d+/;
        const match = rawContent.match(regex);
        const orderCode = match ? match[0] : null;

        if (!orderCode) {
            console.log("WARNING: No valid Order Code found in content.");
            return res.status(200).json({ success: true });
        }

        const order = await Order.findOne({ orderCode: orderCode });

        if (order) {
            order.isPaid = true;
            order.paidAt = new Date();
            await order.save();
            console.log(`SUCCESS: Order ${orderCode} updated to paid.`);
        } else {
            console.log(`WARNING: Order code ${orderCode} not found in database.`);
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Webhook Error Detail:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createSePayPayment,
    handleSePayCallback
};
