const orderService = require('../services/OrderService');
const vnPayService = require('../services/VNPayService');

const createOrder = async (req, res) => {
    try {
        const { orderItems, paymentMethod, itemsPrice, shippingPrice, totalPrice, fullName, address, phone } = req.body;
        if (!orderItems || !paymentMethod || itemsPrice === undefined || shippingPrice === undefined || totalPrice === undefined || !fullName || !address || !phone) {
            return res.status(400).json({
                status: 'ERR',
                message: 'The input is required'
            });
        }
        const response = await orderService.createOrder(req.body);
        return res.status(200).json(response);
    } catch (e) {
        return res.status(500).json({
            message: e.message
        });
    }
};

const getAllOrder = async (req, res) => {
    try {
        const data = await orderService.getAllOrder();
        return res.status(200).json(data);
    } catch (e) {
        return res.status(500).json({
            message: e.message
        });
    }
};

const updateOrder = async (req, res) => {
    try {
        const orderId = req.params.id
        const data = req.body
        if (!orderId) {
            return res.status(200).json({
                status: 'ERR',
                message: 'The orderId is required'
            })
        }
        const response = await orderService.updateOrder(orderId, data)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}

const getDetailsOrder = async (req, res) => {
    try {
        const orderId = req.params.id
        if (!orderId) {
            return res.status(200).json({
                status: 'ERR',
                message: 'The orderId is required'
            })
        }
        const response = await orderService.getDetailsOrder(orderId)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}

const getAllOrderDetails = async (req, res) => {
    try {
        const userId = req.params.id
        if (!userId) {
            return res.status(200).json({
                status: 'ERR',
                message: 'The userId is required'
            })
        }
        const response = await orderService.getAllOrderDetails(userId)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}

const createVNPayPayment = async (req, res) => {
    try {
        const { amount, orderId } = req.body;

        if (!amount || !orderId) {
            return res.status(400).json({
                status: "ERR",
                message: "amount and orderId are required"
            });
        }

        // ===== LẤY IP CHUẨN =====
        let ipAddr =
            req.headers["x-forwarded-for"] ||
            req.socket?.remoteAddress ||
            req.ip ||
            "127.0.0.1";

        if (ipAddr.includes(",")) {
            ipAddr = ipAddr.split(",")[0].trim();
        }

        if (ipAddr === "::1") ipAddr = "127.0.0.1";
        if (ipAddr.startsWith("::ffff:")) {
            ipAddr = ipAddr.replace("::ffff:", "");
        }

        if (ipAddr.includes(":")) ipAddr = "127.0.0.1";

        console.log("IP Used:", ipAddr);

        const paymentUrl = vnPayService.createPaymentUrl(
            amount,
            orderId,
            ipAddr
        );

        console.log("Generated VNPay URL:", paymentUrl);

        return res.status(200).json({
            status: "OK",
            payUrl: paymentUrl
        });

    } catch (e) {
        return res.status(500).json({
            message: e.message
        });
    }
};

const vnpayReturn = async (req, res) => {
    try {
        let vnpParams = req.query;
        let secureHash = vnpParams['vnp_SecureHash'];

        let orderId = vnpParams['vnp_TxnRef'];
        let rspCode = vnpParams['vnp_ResponseCode'];

        const isValid = vnPayService.verifyReturnUrl(vnpParams);

        if (isValid) {
            if (rspCode === '00') {
                // Thanh toán thành công
                await orderService.updateOrder(orderId, {
                    isPaid: true,
                    paidAt: new Date()
                });
                return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/orderSuccess?id=${orderId}`);
            } else {
                // Thanh toán thất bại hoặc hủy
                return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/order?payment=failed`);
            }
        } else {
            return res.status(400).json({ status: 'ERR', message: 'Invalid signature' });
        }

    } catch (e) {
        return res.status(500).json({
            message: e.message
        });
    }
};

module.exports = {
    createOrder,
    getAllOrder,
    updateOrder,
    getDetailsOrder,
    getAllOrderDetails,
    createVNPayPayment,
    vnpayReturn
};
