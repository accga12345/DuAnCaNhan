const User = require('../models/UserModel');
const bcrypt = require('bcrypt');
const { generateToken, generateRefreshToken } = require('./JwtService');
const { sendEmailResetPassword } = require('./EmailService');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const createUser = async (newUser) => {
    try {
        const { email, password } = newUser;

        const checkUser = await User.findOne({ email });

        if (checkUser) {
            return {
                status: "error",
                message: "Email da ton tai"
            };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        newUser.password = hashedPassword;

        const user = await User.create(newUser);

        return {
            status: "success",
            message: "Tạo người dùng mới thành công",
            data: user
        };
    } catch (error) {
        throw error;
    }
};

const loginUser = async (user) => {
    try {
        const { email, password } = user;
        const checkUser = await User.findOne({ email });
        if (!checkUser) {
            return {
                status: "error",
                message: "Khong ton tai nguoi dung"
            };
        }
        const isPasswordValid = await bcrypt.compare(password, checkUser.password);
        if (!isPasswordValid) {
            return {
                status: "error",
                message: "Mat khau khong dung"
            };
        }
        const accessToken = await generateToken(
            {
                id: checkUser._id,
                isAdmin: checkUser.isAdmin,
                isEmployee: checkUser.isEmployee
            }
        )

        const refreshToken = await generateRefreshToken(
            {
                id: checkUser._id,
                isAdmin: checkUser.isAdmin,
                isEmployee: checkUser.isEmployee
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

const updateUser = async (id, data) => {
    try {
        const checkUser = await User.findOne({ _id: id });
        if (!checkUser) {
            return {
                status: "error",
                message: "Khong tim thay nguoi dung"
            };
        }
        if (data.password) {
            const hashedPassword = await bcrypt.hash(data.password, 10);
            data.password = hashedPassword;
        }
        const user = await User.findOneAndUpdate({ _id: id }, data, { new: true });
        return {
            status: "success",
            message: "Cap nhat thong tin thanh cong",
            data: user
        }
    } catch (error) {
        throw error;
    }
}

const deleteUser = async (id) => {
    try {
        const checkUser = await User.findOne({ _id: id });
        if (!checkUser) {
            return {
                status: "error",
                message: "Khong tim thay nguoi dung"
            };
        }
        const user = await User.findOneAndDelete({ _id: id });
        return {
            status: "success",
            message: "Xoa nguoi dung thanh cong",
            data: user
        }
    } catch (error) {
        throw error;
    }
}

const getAllUsers = async () => {
    try {
        const user = await User.find({ isAdmin: false });
        return {
            status: "success",
            message: "Lay danh sach nguoi dung thanh cong",
            data: user
        }
    } catch (error) {
        throw error;
    }
}

const getUserById = async (id) => {
    try {
        const user = await User.findOne({ _id: id });
        return {
            status: "success",
            message: "Lay thong tin nguoi dung thanh cong",
            data: user
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

const deleteManyUser = async (ids) => {
    try {
        const result = await User.deleteMany({ _id: { $in: ids } });
        if (result.deletedCount === 0) {
            return {
                status: "error",
                message: "Khong tim thay nguoi dung"
            };
        }
        return {
            status: "success",
            message: "Xoa nguoi dung thanh cong",
            data: result
        }
    } catch (error) {
        throw error;
    }
}

const forgotPassword = async (email) => {
    try {
        const checkUser = await User.findOne({ email });
        if (!checkUser) {
            return {
                status: "error",
                message: "Email không tồn tại trong hệ thống"
            };
        }

        const token = jwt.sign(
            { id: checkUser._id },
            process.env.ACCESS_TOKEN,
            { expiresIn: '15m' }
        );

        await sendEmailResetPassword(email, token);

        return {
            status: "success",
            message: "Vui lòng kiểm tra email để nhận link khôi phục mật khẩu"
        };
    } catch (error) {
        throw error;
    }
};

const resetPassword = async (token, password) => {
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);
        if (!decoded?.id) {
            return {
                status: "error",
                message: "Token không hợp lệ hoặc đã hết hạn"
            };
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.findOneAndUpdate(
            { _id: decoded.id },
            { password: hashedPassword },
            { new: true }
        );

        if (!user) {
            return {
                status: "error",
                message: "Người dùng không tồn tại"
            };
        }

        return {
            status: "success",
            message: "Đổi mật khẩu thành công"
        };
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return {
                status: "error",
                message: "Link khôi phục đã hết hạn"
            };
        }
        return {
            status: "error",
            message: "Đã có lỗi xảy ra, vui lòng thử lại"
        };
    }
};

module.exports = {
    createUser,
    loginUser,
    updateUser,
    deleteUser,
    getAllUsers,
    getUserById,
    refreshTokenService,
    deleteManyUser,
    forgotPassword,
    resetPassword
}