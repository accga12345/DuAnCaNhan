const orderService = require('../services/OrderService');
const { createPaymentUrl } = require('../services/VNPayService');

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
                status: "error",
                message: "Missing amount or orderId"
            });
        }

        const ipAddr = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

        const paymentUrl = createPaymentUrl(amount, orderId, ipAddr);

        return res.status(200).json({
            status: "success",
            paymentUrl
        });

    } catch (error) {
        console.log("VNPay error:", error);
        return res.status(500).json({
            status: "error",
            message: "Server error"
        });
    }
};


const vnpayReturn = async (req, res) => {
    let vnpParams = req.query;

    const secureHash = vnpParams['vnp_SecureHash'];

    delete vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHashType'];

    vnpParams = sortObject(vnpParams);

    const signData = qs.stringify(vnpParams, { encode: false });

    const signed = crypto
        .createHmac("sha512", process.env.VNPAY_SECRET_KEY)
        .update(signData, "utf-8")
        .digest("hex");

    if (secureHash === signed) {

        const orderId = vnpParams['vnp_TxnRef'];
        const responseCode = vnpParams['vnp_ResponseCode'];

        if (responseCode === "00") {
            await orderService.updateOrder(orderId, {
                isPaid: true,
                paidAt: new Date()
            });

            return res.redirect(`http://localhost:3000/orderSuccess?id=${orderId}`);
        } else {
            return res.redirect(`http://localhost:3000/order?payment=failed`);
        }

    } else {
        return res.redirect(`http://localhost:3000/order?payment=invalid-signature`);
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
