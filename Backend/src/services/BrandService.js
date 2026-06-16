const Brand = require("../models/BrandModel");

const createBrand = async (newBrand) => {
    try {
        const { name } = newBrand;
        const checkBrand = await Brand.findOne({ name });
        if (checkBrand) {
            return {
                status: "error",
                message: "Thương hiệu đã tồn tại",
            };
        }
        const brand = await Brand.create(newBrand);
        return {
            status: "success",
            message: "Tạo thương hiệu thành công",
            data: brand,
        };
    } catch (error) {
        throw error;
    }
};

const updateBrand = async (id, data) => {
    try {
        const checkBrand = await Brand.findOne({ _id: id });
        if (!checkBrand) {
            return {
                status: "error",
                message: "Không tìm thấy thương hiệu",
            };
        }
        if (data.name && checkBrand.name !== data.name) {
            const checkName = await Brand.findOne({ name: data.name });
            if (checkName) {
                return {
                    status: "error",
                    message: "Tên thương hiệu đã tồn tại",
                };
            }
        }
        const brand = await Brand.findOneAndUpdate({ _id: id }, data, { returnDocument: 'after' });
        return {
            status: "success",
            message: "Cập nhật thương hiệu thành công",
            data: brand,
        };
    } catch (error) {
        throw error;
    }
};

const getDetailBrand = async (id) => {
    try {
        const brand = await Brand.findOne({ _id: id });
        return {
            status: "success",
            message: "Lấy thông tin thương hiệu thành công",
            data: brand,
        };
    } catch (error) {
        throw error;
    }
};

const getAllBrands = async () => {
    try {
        const brands = await Brand.find();
        return {
            status: "success",
            message: "Lấy danh sách thương hiệu thành công",
            data: brands,
        };
    } catch (error) {
        throw error;
    }
};

const deleteBrand = async (id) => {
    try {
        const brand = await Brand.findOneAndDelete({ _id: id });
        return {
            status: "success",
            message: "Xóa thương hiệu thành công",
            data: brand,
        };
    } catch (error) {
        throw error;
    }
};

module.exports = {
    createBrand,
    updateBrand,
    getDetailBrand,
    getAllBrands,
    deleteBrand,
};
