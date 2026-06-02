const Product = require("../models/ProductModel");
const Warehouse = require("../models/WarehouseModel");
const Category = require("../models/CategoryModel");
const mongoose = require('mongoose');

const createProduct = async (newProduct) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { name, warehouseItem, countInStock } = newProduct;
        const checkProduct = await Product.findOne({ name }).session(session);
        if (checkProduct) {
            await session.abortTransaction();
            session.endSession();
            return { status: "error", message: "San pham da ton tai" };
        }

        if (warehouseItem) {
            const warehouse = await Warehouse.findById(warehouseItem).session(session);
            if (warehouse) {
                if (Number(countInStock) > warehouse.quantity) {
                    await session.abortTransaction();
                    session.endSession();
                    return {
                        status: "error",
                        message: `So luong vuot qua gioi han kho. Kho con trong ${warehouse.quantity} (Tong ${warehouse.quantity}, da dung 0)`
                    };
                }
                // Option 2: Deduct from Warehouse immediately
                warehouse.quantity -= Number(countInStock);
                await warehouse.save({ session });
            }
        }

        const product = await Product.create([newProduct], { session });
        await session.commitTransaction();
        session.endSession();
        
        return {
            status: "success",
            message: "Tao san pham moi thanh cong",
            data: product[0],
        };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("DEBUG: Error in createProduct:", error);
        throw error;
    }
};

const updateProduct = async (id, data) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const checkProduct = await Product.findOne({ _id: id }).session(session);
        if (!checkProduct) {
            await session.abortTransaction();
            session.endSession();
            return { status: "error", message: "Khong tim thay san pham" };
        }

        const newCount = data.countInStock !== undefined ? Number(data.countInStock) : checkProduct.countInStock;
        const oldCount = checkProduct.countInStock;
        const diff = newCount - oldCount;

        if (diff !== 0 && checkProduct.warehouseItem) {
            const warehouse = await Warehouse.findById(checkProduct.warehouseItem).session(session);
            if (warehouse) {
                if (diff > warehouse.quantity) {
                    await session.abortTransaction();
                    session.endSession();
                    return {
                        status: "error",
                        message: `So luong nhap them (${diff}) vuot qua ton kho (${warehouse.quantity})`
                    };
                }
                // Adjust warehouse stock based on the difference
                warehouse.quantity -= diff;
                await warehouse.save({ session });
            }
        }

        const product = await Product.findOneAndUpdate({ _id: id }, data, { new: true, session }).populate(['supplier', 'warehouseItem', 'category']);
        await session.commitTransaction();
        session.endSession();

        return {
            status: "success",
            message: "Cap nhat san pham thanh cong",
            data: product,
        };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
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
        let objectFilter = {};
        if (filter) {
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
        }

        const totalProducts = await Product.countDocuments(objectFilter);
        const totalPages = Math.ceil(totalProducts / limit);
        
        let query = Product.find(objectFilter);

        if (sort) {
            const objectSort = {};
            objectSort[sort[1]] = sort[0];
            query = query.sort(objectSort);
        }

        const products = await query.skip((page - 1) * limit).limit(limit).populate(['supplier', 'warehouseItem', 'category']);

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

const getCompatibleProducts = async (categoryName, currentBuild, replacedProduct) => {
    try {
        let cat;
        if (mongoose.Types.ObjectId.isValid(categoryName)) {
            cat = await Category.findById(categoryName);
        } else {
            cat = await Category.findOne({ name: new RegExp(`^${categoryName}$`, 'i') });
        }
        if (!cat) {
            return { status: 'error', message: 'Category not found' };
        }

        const query = { category: cat._id };
        const products = await Product.find(query).populate('category');
        return {
            status: 'success',
            data: products
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
    getAllCategoryProduct,
    getCompatibleProducts
};
