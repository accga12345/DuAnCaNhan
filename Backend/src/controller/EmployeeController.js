const EmployeeService = require('../services/EmployeeService');

const createEmployee = async (req, res) => {
    try {
        const { email, password, confirmPassword } = req.body;
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isEmailValid = regex.test(email);
        if (!email || !password || !confirmPassword) {
            return res.status(401).json({
                status: "error",
                message: "Vui lòng nhập đầy đủ thông tin",
            });
        }
        if (!isEmailValid) {
            return res.status(401).json({
                status: "error",
                message: "Vui lòng nhập email hợp lệ",
            });
        } if (password !== confirmPassword) {
            return res.status(401).json({
                status: "error",
                message: "Mật khẩu không khớp",
            });
        }
        const data = await EmployeeService.createEmployee(req.body);
        if (data.status === "error") return res.status(401).json(data);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(401).json({ message: error.message });
    }
}

const loginEmployee = async (req, res) => {
    try {
        const { email, password } = req.body;
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isEmailValid = regex.test(email);
        if (!isEmailValid) {
            return res.status(401).json({
                status: "error",
                message: "Vui lòng nhập email hợp lệ",
            });
        }
        if (!email || !password) {
            return res.status(401).json({
                status: "error",
                message: "Vui lòng nhập đầy đủ thông tin",
            });
        }
        const data = await EmployeeService.loginEmployee(req.body);
        if (data.status === "error") return res.status(401).json(data);
        const { refreshToken, ...newData } = data;
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
        });
        return res.status(200).json(newData);
    } catch (error) {
        return res.status(401).json({ message: error.message });
    }
}

const updateEmployee = async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({
                status: "error",
                message: "khong tim thay nhan vien",
            });
        }
        const data = await EmployeeService.updateEmployee(req.params.id, req.body);
        if (data.status === "error") return res.status(401).json(data);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(401).json({ message: error.message });
    }
}

const deleteEmployee = async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({
                status: "error",
                message: "khong tim thay nhan vien",
            });
        }
        const data = await EmployeeService.deleteEmployee(req.params.id);
        if (data.status === "error") return res.status(401).json(data);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(401).json({ message: error.message });
    }
}

const getAllEmployees = async (req, res) => {
    try {
        const data = await EmployeeService.getAllEmployees();
        if (data.status === "error") return res.status(401).json(data);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const getEmployeeById = async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({
                status: "error",
                message: "khong tim thay nhan vien",
            });
        }
        const data = await EmployeeService.getEmployeeById(req.params.id);
        if (data.status === "error") return res.status(401).json(data);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(401).json({ message: error.message });
    }
}

const refreshTokenService = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;
        const data = await EmployeeService.refreshTokenService(token);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(401).json({ message: error.message });
    }
}

const logoutEmployee = async (req, res) => {
    try {
        res.clearCookie("refreshToken");
        return res.status(200).json({ message: "logout thanh cong" });
    } catch (error) {
        return res.status(401).json({ message: error.message });
    }
}

const deleteManyEmployee = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids) {
            return res.status(400).json({
                status: "error",
                message: "khong tim thay nhan vien",
            });
        }
        const data = await EmployeeService.deleteManyEmployee(ids);
        if (data.status === "error") return res.status(401).json(data);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(401).json({ message: error.message });
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
    logoutEmployee,
    deleteManyEmployee
}
