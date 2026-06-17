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
        const user = req.user;
        
        if (!orderId) {
            return res.status(400).json({
                status: "error",
                message: "khong tim thay don hang",
            });
        }
        const order = await OrderService.getDetailsOrder(orderId);
        
        if (order.status === 'ERR') return res.status(404).json(order);

        // Check ownership: Admin/Staff OR Owner
        if (user.isAdmin || user.isEmployee || String(order.data.user) === String(user.id)) {
            return res.status(200).json(order);
        }

        return res.status(403).json({ message: 'You do not have permission', status: 'error' });
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

const getWarranty = async (req, res) => {
    try {
        const search = req.params.search;
        if (!search) {
            return res.status(400).json({
                status: "error",
                message: "Vui lòng nhập thông tin tìm kiếm",
            });
        }
        const orders = await OrderService.getWarrantyService(search);
        if (orders.status === "ERR") return res.status(404).json(orders);
        return res.status(200).json(orders);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const deleteManyOrder = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({
                status: "error",
                message: "khong tim thay don hang hoặc dữ liệu sai",
            });
        }
        const result = await OrderService.deleteManyOrder(ids);
        if (result.status === 'ERR') return res.status(400).json(result);
        return res.status(200).json(result);
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
    updateOrderReview,
    getWarranty,
    deleteManyOrder
};