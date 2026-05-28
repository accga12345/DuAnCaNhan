const ProductService = require('../services/ProductService');

const createProduct = async (req, res) => {
    try {
        const { name, image, category, price, countInStock, description } = req.body;
        if (!name || !image || !category || price === undefined || price === null || countInStock === undefined || countInStock === null || !description) {
            return res.status(400).json({
                status: "error",
                message: "Vui lòng nhập đầy đủ thông tin",
            });
        }
        const product = await ProductService.createProduct(req.body);
        if (product.status === "error") return res.status(400).json(product);
        return res.status(201).json(product);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const updateProduct = async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({
                status: "error",
                message: "khong tim thay san pham",
            });
        }
        const product = await ProductService.updateProduct(req.params.id, req.body);
        if (product.status === "error") return res.status(404).json(product);
        return res.status(200).json(product);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const getDetailProduct = async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({
                status: "error",
                message: "khong tim thay san pham",
            });
        }
        const product = await ProductService.getDetailProduct(req.params.id);
        if (product.status === "error") return res.status(404).json(product);
        return res.status(200).json(product);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const getAllProducts = async (req, res) => {
    try {
        const { limit, page, sort, filter } = req.query;
        const products = await ProductService.getAllProducts(Number(limit) || 8, Number(page) || 1, sort, filter);
        return res.status(200).json(products);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const deleteProduct = async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({
                status: "error",
                message: "khong tim thay san pham",
            });
        }
        const product = await ProductService.deleteProduct(req.params.id);
        if (product.status === "error") return res.status(404).json(product);
        return res.status(200).json(product);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const deleteManyProduct = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids) {
            return res.status(400).json({
                status: "error",
                message: "khong tim thay san pham",
            });
        }
        const product = await ProductService.deleteManyProduct(ids);
        if (product.status === "error") return res.status(400).json(product);
        return res.status(200).json(product);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const getAllCategoryProduct = async (req, res) => {
    try {
        const allCategory = await ProductService.getAllCategoryProduct();
        return res.status(200).json(allCategory);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}


const getCompatibleProducts = async (req, res) => {
    try {
        const { categoryName, currentBuild, replacedProduct } = req.body;
        // Logic tìm sản phẩm cùng category và kiểm tra tương thích (ví dụ: socket)
        const products = await ProductService.getCompatibleProducts(categoryName, currentBuild, replacedProduct);
        return res.status(200).json(products);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

module.exports = {
    createProduct,
    updateProduct,
    getDetailProduct,
    getAllProducts,
    deleteProduct,
    deleteManyProduct,
    getAllCategoryProduct,
    getCompatibleProducts
};