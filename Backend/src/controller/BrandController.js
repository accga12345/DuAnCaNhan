const BrandService = require('../services/BrandService');

const createBrand = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({
                status: "error",
                message: "Vui lòng nhập ten thuong hieu",
            });
        }
        const brand = await BrandService.createBrand(req.body);
        if (brand.status === "error") return res.status(400).json(brand);
        return res.status(201).json(brand);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const updateBrand = async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({
                status: "error",
                message: "khong tim thay thuong hieu",
            });
        }
        const brand = await BrandService.updateBrand(req.params.id, req.body);
        if (brand.status === "error") return res.status(404).json(brand);
        return res.status(200).json(brand);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const getDetailBrand = async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({
                status: "error",
                message: "khong tim thay thuong hieu",
            });
        }
        const brand = await BrandService.getDetailBrand(req.params.id);
        if (brand.status === "error") return res.status(404).json(brand);
        return res.status(200).json(brand);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const getAllBrands = async (req, res) => {
    try {
        const brands = await BrandService.getAllBrands();
        return res.status(200).json(brands);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const deleteBrand = async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({
                status: "error",
                message: "khong tim thay thuong hieu",
            });
        }
        const brand = await BrandService.deleteBrand(req.params.id);
        if (brand.status === "error") return res.status(404).json(brand);
        return res.status(200).json(brand);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

module.exports = {
    createBrand,
    updateBrand,
    getDetailBrand,
    getAllBrands,
    deleteBrand,
};