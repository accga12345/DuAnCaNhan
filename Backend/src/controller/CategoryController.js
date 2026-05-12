const CategoryService = require('../services/CategoryService');

const createCategory = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({
                status: "error",
                message: "Vui lòng nhập ten danh muc",
            });
        }
        const category = await CategoryService.createCategory(req.body);
        if (category.status === "error") return res.status(400).json(category);
        return res.status(201).json(category);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const updateCategory = async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({
                status: "error",
                message: "khong tim thay danh muc",
            });
        }
        const category = await CategoryService.updateCategory(req.params.id, req.body);
        if (category.status === "error") return res.status(404).json(category);
        return res.status(200).json(category);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const getDetailCategory = async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({
                status: "error",
                message: "khong tim thay danh muc",
            });
        }
        const category = await CategoryService.getDetailCategory(req.params.id);
        if (category.status === "error") return res.status(404).json(category);
        return res.status(200).json(category);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const getAllCategories = async (req, res) => {
    try {
        const categories = await CategoryService.getAllCategories();
        return res.status(200).json(categories);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const deleteCategory = async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({
                status: "error",
                message: "khong tim thay danh muc",
            });
        }
        const category = await CategoryService.deleteCategory(req.params.id);
        if (category.status === "error") return res.status(404).json(category);
        return res.status(200).json(category);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

module.exports = {
    createCategory,
    updateCategory,
    getDetailCategory,
    getAllCategories,
    deleteCategory,
};