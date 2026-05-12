const WarehouseService = require('../services/WarehouseService');

const createWarehouseItem = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({
                status: "error",
                message: "Vui lòng nhập ten san pham",
            });
        }
        const item = await WarehouseService.createWarehouseItem(req.body);
        if (item.status === "error") return res.status(400).json(item);
        return res.status(201).json(item);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const updateWarehouseItem = async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({
                status: "error",
                message: "khong tim thay san pham",
            });
        }
        const item = await WarehouseService.updateWarehouseItem(req.params.id, req.body);
        if (item.status === "error") return res.status(404).json(item);
        return res.status(200).json(item);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const getDetailWarehouseItem = async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({
                status: "error",
                message: "khong tim thay san pham",
            });
        }
        const item = await WarehouseService.getDetailWarehouseItem(req.params.id);
        if (item.status === "error") return res.status(404).json(item);
        return res.status(200).json(item);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const getAllWarehouseItems = async (req, res) => {
    try {
        const items = await WarehouseService.getAllWarehouseItems();
        return res.status(200).json(items);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const deleteWarehouseItem = async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({
                status: "error",
                message: "khong tim thay san pham",
            });
        }
        const item = await WarehouseService.deleteWarehouseItem(req.params.id);
        if (item.status === "error") return res.status(404).json(item);
        return res.status(200).json(item);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

module.exports = {
    createWarehouseItem,
    updateWarehouseItem,
    getDetailWarehouseItem,
    getAllWarehouseItems,
    deleteWarehouseItem,
};