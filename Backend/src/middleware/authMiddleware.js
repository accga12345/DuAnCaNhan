const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const extractToken = (req) => {
    const authHeader = req.headers.authorization || req.headers.token;
    if (!authHeader) return null;

    // Support "Bearer <token>" or raw "<token>"
    if (authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }
    return authHeader;
};

const authMiddleware = async (req, res, next) => {
    try {
        const token = extractToken(req);
        if (!token) {
            return res.status(401).json({ message: 'No token provided', status: 'error' });
        }

        jwt.verify(token, process.env.ACCESS_TOKEN, (err, user) => {
            if (err) return res.status(401).json({ message: 'Unauthorized', status: 'error' });

            if (!user.isAdmin && !user.isEmployee) {
                return res.status(403).json({ message: 'Bạn không có quyền truy cập', status: 'error' });
            }
            req.user = user;
            next();
        });
    } catch (error) {
        return res.status(500).json({ message: error.message, status: 'error' });
    }
};

const authAdminMiddleware = async (req, res, next) => {
    try {
        const token = extractToken(req);
        if (!token) {
            return res.status(401).json({ message: 'No token provided', status: 'error' });
        }

        jwt.verify(token, process.env.ACCESS_TOKEN, (err, user) => {
            if (err) return res.status(401).json({ message: 'Unauthorized', status: 'error' });

            if (!user.isAdmin) {
                return res.status(403).json({ message: 'Bạn không có quyền admin', status: 'error' });
            }
            req.user = user;
            next();
        });
    } catch (error) {
        return res.status(500).json({ message: error.message, status: 'error' });
    }
};

const authUserMiddleware = async (req, res, next) => {
    try {
        const token = extractToken(req);
        if (!token) {
            return res.status(401).json({ message: 'No token provided', status: 'error' });
        }

        const userId = req.params.id;
        jwt.verify(token, process.env.ACCESS_TOKEN, (err, user) => {
            if (err) return res.status(401).json({ message: 'Unauthorized', status: 'error' });

            // If it's the order route, just verify the user is logged in
            // Controller will handle the actual ownership check.
            const isOrderRoute = req.originalUrl.includes('/order/get-details/') || 
                                 req.originalUrl.includes('/order/update/') || 
                                 req.originalUrl.includes('/order/update-review/');

            if (isOrderRoute) {
                req.user = user;
                next();
            } else if (user.isAdmin || user.id === userId || user.isEmployee) {
                req.user = user;
                next();
            }
            else {
                return res.status(403).json({ message: 'You do not have permission', status: 'error' });
            }

        });
    } catch (error) {
        return res.status(500).json({ message: error.message, status: 'error' });
    }
};


module.exports = {
    authMiddleware,
    authUserMiddleware,
    authAdminMiddleware
}