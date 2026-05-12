const Product = require("../models/ProductModel");
const Warehouse = require("../models/WarehouseModel");
const Category = require("../models/CategoryModel");
const mongoose = require('mongoose');

const createProduct = async (newProduct) => {
    try {
        const { name, warehouseItem, countInStock } = newProduct;
        const checkProduct = await Product.findOne({ name });
        if (checkProduct) {
            return {
                status: "error",
                message: "San pham da ton tai",
            };
        }


        if (warehouseItem) {
            const warehouse = await Warehouse.findById(warehouseItem);
            if (warehouse) {
                const otherProducts = await Product.find({ warehouseItem });
                const usedStock = otherProducts.reduce((sum, p) => sum + p.countInStock, 0);
                const availableStock = warehouse.quantity - usedStock;

                if (Number(countInStock) > availableStock) {
                    return {
                        status: "error",
                        message: `So luong vuot qua gioi han kho. Kho con trong ${availableStock} (Tong ${warehouse.quantity}, da dung ${usedStock})`
                    };
                }
            }
        }

        const product = await (await Product.create(newProduct)).populate(['supplier', 'warehouseItem', 'category']);
        return {
            status: "success",
            message: "Tao san pham moi thanh cong",
            data: product,
        };
    } catch (error) {
        console.error("DEBUG: Error in createProduct:", error);
        throw error;
    }
};

const updateProduct = async (id, data) => {
    try {
        const checkProduct = await Product.findOne({ _id: id });
        if (!checkProduct) {
            return {
                status: "error",
                message: "Khong tim thay san pham",
            };
        } else if (checkProduct.name !== data.name) {
            const checkProduct = await Product.findOne({ name: data.name });
            if (checkProduct) {
                return {
                    status: "error",
                    message: "San pham da ton tai",
                };
            }
        }


        const warehouseItem = data.warehouseItem || checkProduct.warehouseItem;
        const countInStock = data.countInStock !== undefined ? data.countInStock : checkProduct.countInStock;

        if (warehouseItem) {
            const warehouse = await Warehouse.findById(warehouseItem);
            if (warehouse) {
                const otherProducts = await Product.find({
                    warehouseItem,
                    _id: { $ne: id }
                });
                const usedStockByOthers = otherProducts.reduce((sum, p) => sum + p.countInStock, 0);
                const availableStock = warehouse.quantity - usedStockByOthers;

                if (Number(countInStock) > availableStock) {
                    return {
                        status: "error",
                        message: `So luong vuot qua gioi han kho. Kho con trong ${availableStock} (Tong ${warehouse.quantity}, da dung ${usedStockByOthers})`
                    };
                }
            }
        }

        const product = await Product.findOneAndUpdate({ _id: id }, data, { new: true }).populate(['supplier', 'warehouseItem', 'category']);
        return {
            status: "success",
            message: "Cap nhat san pham thanh cong",
            data: product,
        };
    } catch (error) {
        console.error("DEBUG: Error in updateProduct:", error);
        throw error;
    }
};


const getDetailProduct = async (id) => {
    try {
        const product = await Product.findOne({ _id: id }).populate(['supplier', 'warehouseItem', 'category']);
        return {
            status: "success",
            message: "Lay thong tin san pham thanh cong",
            data: product,
        };
    } catch (error) {
        console.error("DEBUG: Error in getDetailProduct:", error);
        throw error;
    }
};

const getAllProducts = async (limit, page, sort, filter) => {
    try {
        const totalProducts = await Product.countDocuments();
        const totalPages = Math.ceil(totalProducts / limit);
        if (sort) {
            const objectSort = {};
            objectSort[sort[1]] = sort[0];
            const productsSort = await Product.find({}).sort(objectSort).skip((page - 1) * limit).limit(limit).populate(['supplier', 'warehouseItem', 'category']);
            return {
                status: "success",
                message: "Lay danh sach san pham thanh cong",
                data: productsSort,
                totalProducts,
                totalPages,
                pageCurrent: page
            };
        }
        if (filter) {
            const objectFilter = {};
            if (Array.isArray(filter)) {
                for (let i = 0; i < filter.length; i += 2) {
                    if (filter[i] && filter[i + 1]) {
                        const val = filter[i + 1];
                        if (filter[i] === 'price' || filter[i] === 'rating') {
                            const numVal = Number(val.replace(/[^0-9]/g, ''));
                            if (!isNaN(numVal)) {
                                if (val.includes('dưới')) {
                                    objectFilter[filter[i]] = { $lte: numVal };
                                } else {
                                    objectFilter[filter[i]] = { $gte: numVal };
                                }
                            }
                        } else if (filter[i] === 'category') {
                            if (val && val !== 'undefined' && mongoose.Types.ObjectId.isValid(val)) {
                                objectFilter[filter[i]] = new mongoose.Types.ObjectId(val);
                            }
                        } else {
                            objectFilter[filter[i]] = { $regex: val, $options: 'i' };
                        }
                    }
                }
            }
            const productsFilter = await Product.find(objectFilter).skip((page - 1) * limit).limit(limit).populate(['supplier', 'warehouseItem', 'category']);
            return {
                status: "success",
                message: "Lay danh sach san pham thanh cong",
                data: productsFilter,
                totalProducts,
                totalPages,
                pageCurrent: page
            };
        }
        const products = await Product.find({}).skip((page - 1) * limit).limit(limit).populate(['supplier', 'warehouseItem', 'category']);
        return {
            status: "success",
            message: "Lay danh sach san pham thanh cong",
            data: products,
            totalProducts,
            totalPages,
            pageCurrent: page
        };
    } catch (error) {
        console.error("DEBUG: Error in getAllProducts:", error);
        throw error;
    }
};

const deleteProduct = async (id) => {
    try {
        const product = await Product.findOneAndDelete({ _id: id });
        return {
            status: "success",
            message: "Xoa san pham thanh cong",
            data: product,
        };
    } catch (error) {
        console.error("DEBUG: Error in deleteProduct:", error);
        throw error;
    }
};
const deleteManyProduct = async (ids) => {
    try {
        const result = await Product.deleteMany({ _id: { $in: ids } });
        if (result.deletedCount === 0) {
            return {
                status: "error",
                message: "Khong tim thay san pham"
            };
        }
        return {
            status: "success",
            message: "Xoa san pham thanh cong",
            data: result,
        };
    } catch (error) {
        console.error("DEBUG: Error in deleteManyProduct:", error);
        throw error;
    }
};

const getAllCategoryProduct = async () => {
    try {
        const allCategory = await Category.find();
        return {
            status: 'success',
            message: 'SUCCESS',
            data: allCategory
        };
    } catch (e) {
        throw e;
    }
};

module.exports = {
    createProduct,
    updateProduct,
    getDetailProduct,
    getAllProducts,
    deleteProduct,
    deleteManyProduct,
    getAllCategoryProduct
};