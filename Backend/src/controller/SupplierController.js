const SupplierService = require('../services/SupplierService');

const createSupplier = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({
                status: "error",
                message: "Vui lòng nhập ten nha cung cap",
            });
        }
        const supplier = await SupplierService.createSupplier(req.body);
        if (supplier.status === "error") return res.status(400).json(supplier);
        return res.status(201).json(supplier);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const updateSupplier = async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({
                status: "error",
                message: "khong tim thay nha cung cap",
            });
        }
        const supplier = await SupplierService.updateSupplier(req.params.id, req.body);
        if (supplier.status === "error") return res.status(404).json(supplier);
        return res.status(200).json(supplier);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const getDetailSupplier = async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({
                status: "error",
                message: "khong tim thay nha cung cap",
            });
        }
        const supplier = await SupplierService.getDetailSupplier(req.params.id);
        if (supplier.status === "error") return res.status(404).json(supplier);
        return res.status(200).json(supplier);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const getAllSuppliers = async (req, res) => {
    try {
        const suppliers = await SupplierService.getAllSuppliers();
        return res.status(200).json(suppliers);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const deleteSupplier = async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({
                status: "error",
                message: "khong tim thay nha cung cap",
            });
        }
        const supplier = await SupplierService.deleteSupplier(req.params.id);
        if (supplier.status === "error") return res.status(404).json(supplier);
        return res.status(200).json(supplier);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

module.exports = {
    createSupplier,
    updateSupplier,
    getDetailSupplier,
    getAllSuppliers,
    deleteSupplier,
};