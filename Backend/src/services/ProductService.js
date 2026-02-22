const Product = require("../models/ProductModel");

const createProduct = async (newProduct) => {
    try {
        const { name, image, type, price, countInStock, rating, description } = newProduct;
        const checkProduct = await Product.findOne({ name });
        if (checkProduct) {
            return {
                status: "error",
                message: "San pham da ton tai",
            };
        }
        const product = await Product.create(newProduct);
        return {
            status: "success",
            message: "Tao san pham moi thanh cong",
            data: product,
        };
    } catch (error) {
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
        const product = await Product.findOneAndUpdate({ _id: id }, data, { new: true });
        return {
            status: "success",
            message: "Cap nhat san pham thanh cong",
            data: product,
        };
    } catch (error) {
        throw error;
    }
};


const getDetailProduct = async (id) => {
    try {
        const product = await Product.findOne({ _id: id });
        return {
            status: "success",
            message: "Lay thong tin san pham thanh cong",
            data: product,
        };
    } catch (error) {
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
            const productsSort = await Product.find({}).sort(objectSort).skip((page - 1) * limit).limit(limit);
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
                        } else {
                            objectFilter[filter[i]] = { $regex: val, $options: 'i' };
                        }
                    }
                }
            }
            const productsFilter = await Product.find(objectFilter).skip((page - 1) * limit).limit(limit);
            return {
                status: "success",
                message: "Lay danh sach san pham thanh cong",
                data: productsFilter,
                totalProducts,
                totalPages,
                pageCurrent: page
            };
        }
        const products = await Product.find({}).skip((page - 1) * limit).limit(limit);
        return {
            status: "success",
            message: "Lay danh sach san pham thanh cong",
            data: products,
            totalProducts,
            totalPages,
            pageCurrent: page
        };
    } catch (error) {
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
        throw error;
    }
};

const getAllTypeProduct = async () => {
    try {
        const typeProduct = await Product.find({}).distinct("type");
        return {
            status: "success",
            message: "Lay danh sach loai san pham thanh cong",
            data: typeProduct,
        };
    } catch (error) {
        throw error;
    }
};


module.exports = {
    createProduct,
    updateProduct,
    getDetailProduct,
    getAllProducts,
    deleteProduct,
    deleteManyProduct,
    getAllTypeProduct
};