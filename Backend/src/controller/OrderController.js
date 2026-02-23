const orderService = require('../services/OrderService');
const momoService = require('../services/MoMoService');

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

const paymentMoMo = async (req, res) => {
    try {
        const { amount, orderId, orderInfo } = req.body;

        if (!amount || !orderId || !orderInfo) {
            return res.status(400).json({
                status: 'ERR',
                message: 'amount, orderId, and orderInfo are required'
            });
        }

        const response = await momoService.createPaymentMoMo(
            String(amount),
            orderId,
            orderInfo
        );

        return res.status(200).json(response);

    } catch (e) {
        return res.status(500).json({
            message: e.message
        });
    }
};


const callbackMoMo = async (req, res) => {
    try {
        const secretKey = process.env.MOMO_SECRET_KEY;
        const {
            partnerCode,
            orderId,
            requestId,
            amount,
            orderInfo,
            orderType,
            transId,
            resultCode,
            message,
            payType,
            responseTime,
            extraData,
            signature
        } = req.body;

        const rawSignature =
            `accessKey=${process.env.MOMO_ACCESS_KEY}` +
            `&amount=${amount}` +
            `&extraData=${extraData}` +
            `&message=${message}` +
            `&orderId=${orderId}` +
            `&orderInfo=${orderInfo}` +
            `&orderType=${orderType}` +
            `&partnerCode=${partnerCode}` +
            `&payType=${payType}` +
            `&requestId=${requestId}` +
            `&responseTime=${responseTime}` +
            `&resultCode=${resultCode}` +
            `&transId=${transId}`;

        const checkSignature = crypto
            .createHmac("sha256", secretKey)
            .update(rawSignature)
            .digest("hex");

        if (checkSignature !== signature) {
            return res.status(400).json({
                status: "ERR",
                message: "Invalid signature"
            });
        }

        // Nếu thanh toán thành công
        if (resultCode == 0) {
            await orderService.updateOrder(orderId, {
                isPaid: true,
                paidAt: new Date()
            });
        }

        return res.status(200).json({ message: "OK" });

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
    paymentMoMo,
    callbackMoMo

};
