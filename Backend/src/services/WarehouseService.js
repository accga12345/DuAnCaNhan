const Warehouse = require("../models/WarehouseModel");

const Product = require("../models/ProductModel");

const createWarehouseItem = async (newItem) => {
    try {
        const { name } = newItem;
        const checkItem = await Warehouse.findOne({ name });
        if (checkItem) {
            return {
                status: "error",
                message: "Sản phẩm này đã tồn tại trong kho",
            };
        }
        const item = await Warehouse.create(newItem);
        return {
            status: "success",
            message: "Nhập kho thành công",
            data: item,
        };
    } catch (error) {
        throw error;
    }
};

const updateWarehouseItem = async (id, data) => {
    try {
        const checkItem = await Warehouse.findOne({ _id: id });
        if (!checkItem) {
            return {
                status: "error",
                message: "Không tìm thấy hàng trong kho",
            };
        }
        
        // Cập nhật Warehouse item
        const item = await Warehouse.findOneAndUpdate({ _id: id }, data, { new: true });
        
        // Đồng bộ sang bảng Product nếu có thay đổi liên quan
        if (data.name || data.category || data.brand) {
            const updateProductData = {};
            if (data.name) updateProductData.name = data.name;
            if (data.category) updateProductData.category = data.category;
            if (data.brand) updateProductData.brand = data.brand;
            
            await Product.updateMany({ warehouseItem: id }, { $set: updateProductData });
        }
        
        return {
            status: "success",
            message: "Cập nhật kho và sản phẩm liên quan thành công",
            data: item,
        };
    } catch (error) {
        throw error;
    }
};

const getDetailWarehouseItem = async (id) => {
    try {
        const item = await Warehouse.findOne({ _id: id }).populate('category').populate('supplier');
        return {
            status: "success",
            message: "Lấy thông tin kho thành công",
            data: item,
        };
    } catch (error) {
        throw error;
    }
};

const getAllWarehouseItems = async () => {
    try {
        const items = await Warehouse.find().populate('category').populate('supplier');
        return {
            status: "success",
            message: "Lấy danh sách kho thành công",
            data: items,
        };
    } catch (error) {
        throw error;
    }
};

const deleteWarehouseItem = async (id) => {
    try {
        const item = await Warehouse.findOneAndDelete({ _id: id });
        return {
            status: "success",
            message: "Xóa hàng khỏi kho thành công",
            data: item,
        };
    } catch (error) {
        throw error;
    }
};

module.exports = {
    createWarehouseItem,
    updateWarehouseItem,
    getDetailWarehouseItem,
    getAllWarehouseItems,
    deleteWarehouseItem,
};
