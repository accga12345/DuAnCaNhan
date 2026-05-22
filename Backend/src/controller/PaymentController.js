const SePayService = require('../services/SePayService');
const Order = require('../models/OrderProductModel');

const createSePayPayment = async (req, res) => {
    try {
        const { amount, orderId } = req.body;
        if (!amount || !orderId) {
            return res.status(400).json({
                status: 'error',
                message: 'Thiếu số tiền hoặc mã đơn hàng'
            });
        }
        const data = await SePayService.createPaymentUrl(amount, orderId);
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
        console.log("--------------------");
        console.log("SePay Webhook Received Data:", JSON.stringify(req.body, null, 2));
        
        const { content, order_invoice_number } = req.body;
        const rawContent = order_invoice_number || content || "";

        // Tìm mã ID đơn hàng (24 ký tự hex của MongoDB) trong chuỗi nội dung
        // Ví dụ: "SEVQR Thanh toan don hang 6649f..." -> Lấy ra "6649f..."
        const regex = /[0-9a-fA-F]{24}/;
        const match = rawContent.match(regex);
        const orderId = match ? match[0] : null;

        console.log("Extracted Order ID:", orderId);

        if (!orderId) {
            console.log("WARNING: No valid Order ID found in content.");
            return res.status(200).json({ success: true }); // Trả về success để SePay không gửi lại nữa
        }

        const order = await Order.findOne({ _id: orderId });
        
        if (order) {
            order.isPaid = true;
            order.paidAt = new Date();
            await order.save();
            console.log(`SUCCESS: Order ${orderId} updated to paid.`);
        } else {
            console.log(`WARNING: Order ${orderId} not found in database.`);
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
