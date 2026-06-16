const express = require('express');
const router = express.Router();
const notificationController = require('../controller/NotificationController');

router.get('/get-all', notificationController.getAllNotifications);
router.put('/mark-as-read/:id', notificationController.markAsRead);
router.delete('/delete/:id', notificationController.deleteNotification);

module.exports = router;
