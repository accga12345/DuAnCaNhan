const Notification = require('../models/NotificationModel');

const getAllNotifications = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        let query = {};
        if (req.query.userId) {
            query.userId = req.query.userId;
        } else {
            query.userId = { $exists: false }; // Thông báo cho admin
        }
        const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(limit);
        return res.status(200).json({
            status: 'OK',
            message: 'SUCCESS',
            data: notifications
        });
    } catch (e) {
        return res.status(500).json({
            message: e.message
        });
    }
};

const markAsRead = async (req, res) => {
    try {
        const id = req.params.id;
        const notification = await Notification.findByIdAndUpdate(id, { isRead: true }, { returnDocument: 'after' });
        return res.status(200).json({
            status: 'OK',
            message: 'SUCCESS',
            data: notification
        });
    } catch (e) {
        return res.status(500).json({
            message: e.message
        });
    }
};

module.exports = {
    getAllNotifications,
    markAsRead
};
