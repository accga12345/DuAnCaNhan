const OrderService = require('../services/OrderService');

const createOrder = async (req, res) => {
    try {
        const { paymentMethod, itemsPrice, shippingPrice, totalPrice, fullName, address, phone } = req.body;
        if (!paymentMethod || !itemsPrice || shippingPrice === undefined || !totalPrice || !fullName || !address || !phone) {
            return res.status(400).json({
                status: "error",
                message: "Vui lòng nhập đầy đủ thông tin",
            });
        }
        const order = await OrderService.createOrder(req.body);
        if (order.status === "ERR") return res.status(400).json(order);
        return res.status(201).json(order);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const getAllOrder = async (req, res) => {
    try {
        const order = await OrderService.getAllOrder();
        return res.status(200).json(order);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const updateOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        const data = req.body;
        if (!orderId) {
            return res.status(400).json({
                status: "error",
                message: "khong tim thay don hang",
            });
        }
        const order = await OrderService.updateOrder(orderId, data);
        if (order.status === "ERR") return res.status(404).json(order);
        return res.status(200).json(order);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const getDetailsOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        if (!orderId) {
            return res.status(400).json({
                status: "error",
                message: "khong tim thay don hang",
            });
        }
        const order = await OrderService.getDetailsOrder(orderId);
        if (order.status === "ERR") return res.status(404).json(order);
        return res.status(200).json(order);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const getAllOrderDetails = async (req, res) => {
    try {
        const userId = req.params.id;
        if (!userId) {
            return res.status(400).json({
                status: "error",
                message: "khong tim thay nguoi dung",
            });
        }
        const order = await OrderService.getAllOrderDetails(userId);
        if (order.status === "ERR") return res.status(404).json(order);
        return res.status(200).json(order);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const updateOrderReview = async (req, res) => {
    try {
        const orderId = req.params.id;
        const data = req.body;
        if (!orderId) {
            return res.status(400).json({
                status: "error",
                message: "khong tim thay don hang",
            });
        }
        const order = await OrderService.updateOrderReview(orderId, data);
        return res.status(200).json(order);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

module.exports = {
    createOrder,
    getAllOrder,
    updateOrder,
    getDetailsOrder,
    getAllOrderDetails,
    updateOrderReview
};