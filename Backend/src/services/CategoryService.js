const Category = require("../models/CategoryModel");

const createCategory = async (newCategory) => {
    try {
        const { name } = newCategory;
        const checkCategory = await Category.findOne({ name });
        if (checkCategory) {
            return {
                status: "error",
                message: "Danh muc da ton tai",
            };
        }
        let category = await Category.create(newCategory);
        category = await category.populate('brands');
        return {
            status: "success",
            message: "Tao danh muc thanh cong",
            data: category,
        };
    } catch (error) {
        throw error;
    }
};

const updateCategory = async (id, data) => {
    try {
        const checkCategory = await Category.findOne({ _id: id });
        if (!checkCategory) {
            return {
                status: "error",
                message: "Khong tim thay danh muc",
            };
        }
        if (data.name && checkCategory.name !== data.name) {
            const checkName = await Category.findOne({ name: data.name });
            if (checkName) {
                return {
                    status: "error",
                    message: "Ten danh muc da ton tai",
                };
            }
        }
        const category = await Category.findOneAndUpdate({ _id: id }, data, { returnDocument: 'after' }).populate('brands');
        return {
            status: "success",
            message: "Cap nhat danh muc thanh cong",
            data: category,
        };
    } catch (error) {
        throw error;
    }
};

const getDetailCategory = async (id) => {
    try {
        const category = await Category.findOne({ _id: id }).populate('brands');
        return {
            status: "success",
            message: "Lay thong tin danh muc thanh cong",
            data: category,
        };
    } catch (error) {
        throw error;
    }
};

const getAllCategories = async () => {
    try {
        const categories = await Category.find().populate('brands');
        return {
            status: "success",
            message: "Lay danh sach danh muc thanh cong",
            data: categories,
        };
    } catch (error) {
        throw error;
    }
};

const deleteCategory = async (id) => {
    try {
        const category = await Category.findOneAndDelete({ _id: id });
        return {
            status: "success",
            message: "Xoa danh muc thanh cong",
            data: category,
        };
    } catch (error) {
        throw error;
    }
};

module.exports = {
    createCategory,
    updateCategory,
    getDetailCategory,
    getAllCategories,
    deleteCategory,
};
