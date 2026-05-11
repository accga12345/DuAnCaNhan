const Employee = require('../models/EmployeeModel');
const bcrypt = require('bcrypt');
const { generateToken, generateRefreshToken } = require('./JwtService');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const createEmployee = async (newEmployee) => {
    try {
        const { email, password } = newEmployee;

        const checkEmployee = await Employee.findOne({ email });

        if (checkEmployee) {
            return {
                status: "error",
                message: "Email da ton tai"
            };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        newEmployee.password = hashedPassword;

        const employee = await Employee.create(newEmployee);

        return {
            status: "success",
            message: "Tạo nhân viên mới thành công",
            data: employee
        };
    } catch (error) {
        throw error;
    }
};

const loginEmployee = async (employee) => {
    try {
        const { email, password } = employee;
        const checkEmployee = await Employee.findOne({ email });
        if (!checkEmployee) {
            return {
                status: "error",
                message: "Khong ton tai nhan vien"
            };
        }
        const isPasswordValid = await bcrypt.compare(password, checkEmployee.password);
        if (!isPasswordValid) {
            return {
                status: "error",
                message: "Mat khau khong dung"
            };
        }
        const accessToken = await generateToken(
            {
                id: checkEmployee._id,
                isAdmin: checkEmployee.isAdmin,
                isEmployee: checkEmployee.isEmployee // Included to differentiate in authMiddleware
            }
        )

        const refreshToken = await generateRefreshToken(
            {
                id: checkEmployee._id,
                isAdmin: checkEmployee.isAdmin,
                isEmployee: checkEmployee.isEmployee
            }
        )
        return {
            status: "success",
            message: "Dang nhap thanh cong",
            accessToken,
            refreshToken
        };
    } catch (error) {
        throw error;
    }
};

const updateEmployee = async (id, data) => {
    try {
        const checkEmployee = await Employee.findOne({ _id: id });
        if (!checkEmployee) {
            return {
                status: "error",
                message: "Khong tim thay nhan vien"
            };
        }
        if (data.password) {
            const hashedPassword = await bcrypt.hash(data.password, 10);
            data.password = hashedPassword;
        }
        const employee = await Employee.findOneAndUpdate({ _id: id }, data, { new: true });
        return {
            status: "success",
            message: "Cap nhat thong tin thanh cong",
            data: employee
        }
    } catch (error) {
        throw error;
    }
}

const deleteEmployee = async (id) => {
    try {
        const checkEmployee = await Employee.findOne({ _id: id });
        if (!checkEmployee) {
            return {
                status: "error",
                message: "Khong tim thay nhan vien"
            };
        }
        const employee = await Employee.findOneAndDelete({ _id: id });
        return {
            status: "success",
            message: "Xoa nhan vien thanh cong",
            data: employee
        }
    } catch (error) {
        throw error;
    }
}

const getAllEmployees = async () => {
    try {
        const employees = await Employee.find();
        return {
            status: "success",
            message: "Lay danh sach nhan vien thanh cong",
            data: employees
        }
    } catch (error) {
        throw error;
    }
}

const getEmployeeById = async (id) => {
    try {
        const employee = await Employee.findOne({ _id: id });
        return {
            status: "success",
            message: "Lay thong tin nhan vien thanh cong",
            data: employee
        }
    } catch (error) {
        throw error;
    }
}

const refreshTokenService = async (token) => {
    try {
        const data = await jwt.verify(token, process.env.REFRESH_TOKEN);
        const accessToken = await generateToken({
            id: data.id,
            isAdmin: data.isAdmin,
            isEmployee: data.isEmployee
        });
        return {
            status: "success",
            message: "Refresh token thanh cong",
            accessToken: accessToken
        }
    } catch (error) {
        throw error;
    }
}

const deleteManyEmployee = async (ids) => {
    try {
        const result = await Employee.deleteMany({ _id: { $in: ids } });
        if (result.deletedCount === 0) {
            return {
                status: "error",
                message: "Khong tim thay nhan vien"
            };
        }
        return {
            status: "success",
            message: "Xoa nhan vien thanh cong",
            data: result
        }
    } catch (error) {
        throw error;
    }
}

module.exports = {
    createEmployee,
    loginEmployee,
    updateEmployee,
    deleteEmployee,
    getAllEmployees,
    getEmployeeById,
    refreshTokenService,
    deleteManyEmployee
}
