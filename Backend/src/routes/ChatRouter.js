const express = require('express');
const router = express.Router();
const ChatController = require('../controller/ChatController');

router.post('/message', ChatController.handleChat);
router.post('/replace', ChatController.replaceComponent);

module.exports = router;