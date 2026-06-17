const Notification = require('../models/NotificationModel');

const getAllNotifications = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const userId = req.query.userId || req.query.currentUserId;
        
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const notifications = await Notification.find({ userId: userId })
            .sort({ createdAt: -1 })
            .limit(limit);
        
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
        const updatedNotification = await Notification.findByIdAndUpdate(
            id, 
            { isRead: true }, 
            { new: true }
        );

        if (!updatedNotification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        return res.status(200).json({
            status: 'OK',
            message: 'SUCCESS',
            data: updatedNotification
        });
    } catch (e) {
        return res.status(500).json({
            message: e.message
        });
    }
};

const deleteNotification = async (req, res) => {
    try {
        const id = req.params.id;
        
        if (!id || id === 'undefined') {
            return res.status(400).json({ message: 'Invalid Notification ID' });
        }

        const deleted = await Notification.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        return res.status(200).json({
            status: 'OK',
            message: 'DELETE SUCCESS'
        });
    } catch (e) {
        return res.status(500).json({
            message: e.message
        });
    }
};

module.exports = {
    getAllNotifications,
    markAsRead,
    deleteNotification
};
