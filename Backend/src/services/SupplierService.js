const Supplier = require("../models/SupplierModel");

const createSupplier = async (newSupplier) => {
    try {
        const { name } = newSupplier;
        const checkSupplier = await Supplier.findOne({ name });
        if (checkSupplier) {
            return {
                status: "error",
                message: "Nhà cung cấp đã tồn tại",
            };
        }
        const supplier = await Supplier.create(newSupplier);
        return {
            status: "success",
            message: "Tạo nhà cung cấp thành công",
            data: supplier,
        };
    } catch (error) {
        throw error;
    }
};

const updateSupplier = async (id, data) => {
    try {
        const checkSupplier = await Supplier.findOne({ _id: id });
        if (!checkSupplier) {
            return {
                status: "error",
                message: "Không tìm thấy nhà cung cấp",
            };
        }
        if (data.name && checkSupplier.name !== data.name) {
            const checkName = await Supplier.findOne({ name: data.name });
            if (checkName) {
                return {
                    status: "error",
                    message: "Tên nhà cung cấp đã tồn tại",
                };
            }
        }
        const supplier = await Supplier.findOneAndUpdate({ _id: id }, data, { returnDocument: 'after' });
        return {
            status: "success",
            message: "Cập nhật nhà cung cấp thành công",
            data: supplier,
        };
    } catch (error) {
        throw error;
    }
};

const getDetailSupplier = async (id) => {
    try {
        const supplier = await Supplier.findOne({ _id: id });
        return {
            status: "success",
            message: "Lấy thông tin nhà cung cấp thành công",
            data: supplier,
        };
    } catch (error) {
        throw error;
    }
};

const getAllSuppliers = async () => {
    try {
        const suppliers = await Supplier.find();
        return {
            status: "success",
            message: "Lấy danh sách nhà cung cấp thành công",
            data: suppliers,
        };
    } catch (error) {
        throw error;
    }
};

const deleteSupplier = async (id) => {
    try {
        const supplier = await Supplier.findOneAndDelete({ _id: id });
        return {
            status: "success",
            message: "Xóa nhà cung cấp thành công",
            data: supplier,
        };
    } catch (error) {
        throw error;
    }
};

module.exports = {
    createSupplier,
    updateSupplier,
    getDetailSupplier,
    getAllSuppliers,
    deleteSupplier,
};
