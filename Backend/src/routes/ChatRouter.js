const express = require('express');
const router = express.Router();
const ChatController = require('../controller/ChatController');

router.post('/message', ChatController.handleChat);

module.exports = router;