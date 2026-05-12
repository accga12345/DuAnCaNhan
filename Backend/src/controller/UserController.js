const UserService = require('../services/UserService');

const createUser = async (req, res) => {
    try {
        const { email, password, confirmPassword } = req.body;
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isEmailValid = regex.test(email);
        if (!email || !password || !confirmPassword) {
            return res.status(400).json({
                status: "error",
                message: "Vui lòng nhập đầy đủ thông tin",
            });
        }
        if (!isEmailValid) {
            return res.status(400).json({
                status: "error",
                message: "Vui lòng nhập email hợp lệ",
            });
        } 
        if (password !== confirmPassword) {
            return res.status(400).json({
                status: "error",
                message: "Mật khẩu không khớp",
            });
        }
        const data = await UserService.createUser(req.body);
        if (data.status === "error") {
            if (data.message === "Email da ton tai") {
                return res.status(409).json(data);
            }
            return res.status(400).json(data);
        }
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isEmailValid = regex.test(email);
        if (!isEmailValid) {
            return res.status(400).json({
                status: "error",
                message: "Vui lòng nhập email hợp lệ",
            });
        }
        if (!email || !password) {
            return res.status(400).json({
                status: "error",
                message: "Vui lòng nhập đầy đủ thông tin",
            });
        }
        const data = await UserService.loginUser(req.body);
        if (data.status === "error") {
            return res.status(401).json(data);
        }
        const { refreshToken, ...newData } = data;
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
        });
        return res.status(200).json(newData);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const updateUser = async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({
                status: "error",
                message: "khong tim thay nguoi dung",
            });
        }
        const data = await UserService.updateUser(req.params.id, req.body);
        if (data.status === "error") return res.status(400).json(data);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const deleteUser = async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({
                status: "error",
                message: "khong tim thay nguoi dung",
            });
        }
        const data = await UserService.deleteUser(req.params.id);
        if (data.status === "error") return res.status(400).json(data);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const getAllUsers = async (req, res) => {
    try {
        const data = await UserService.getAllUsers();
        if (data.status === "error") return res.status(400).json(data);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const getUserById = async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({
                status: "error",
                message: "khong tim thay nguoi dung",
            });
        }
        const data = await UserService.getUserById(req.params.id);
        if (data.status === "error") return res.status(400).json(data);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const refreshTokenService = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;
        if (!token) {
            return res.status(401).json({
                status: "error",
                message: "Khong co refresh token"
            });
        }
        const data = await UserService.refreshTokenService(token);
        if (data.status === "error") return res.status(401).json(data);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(401).json({ message: error.message });
    }
}

const logoutUser = async (req, res) => {
    try {
        res.clearCookie("refreshToken");
        return res.status(200).json({ message: "logout thanh cong" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const deleteManyUser = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids) {
            return res.status(400).json({
                status: "error",
                message: "khong tim thay nguoi dung",
            });
        }
        const data = await UserService.deleteManyUser(ids);
        if (data.status === "error") return res.status(400).json(data);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

module.exports = {
    createUser,
    loginUser,
    updateUser,
    deleteUser,
    getAllUsers,
    getUserById,
    refreshTokenService,
    logoutUser,
    deleteManyUser
}