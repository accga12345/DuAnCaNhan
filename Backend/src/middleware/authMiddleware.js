const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.token.split(' ')[1];
        jwt.verify(token, process.env.ACCESS_TOKEN, (err, user) => {
            if (err) return res.status(401).json({ message: 'Unauthorized' });

            if (!user.isAdmin && !user.isEmployee) {
                return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
            }
            next();
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const authAdminMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.token.split(' ')[1];
        jwt.verify(token, process.env.ACCESS_TOKEN, (err, user) => {
            if (err) return res.status(401).json({ message: 'Unauthorized' });

            if (!user.isAdmin) {
                return res.status(403).json({ message: 'Bạn không có quyền admin' });
            }
            next();
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const authUserMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.token.split(' ')[1];
        const userId = req.params.id;
        jwt.verify(token, process.env.ACCESS_TOKEN, (err, user) => {
            if (err) return res.status(401).json({ message: 'Unauthorized' });

            if (user.isAdmin || user.id === userId) {
                next();
            }
            else {
                return res.status(403).json({ message: 'You do not have permission' });
            }

        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};


module.exports = {
    authMiddleware,
    authUserMiddleware,
    authAdminMiddleware
}