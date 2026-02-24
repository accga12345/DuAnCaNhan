const express = require('express');
const router = express.Router();
const { authMiddleware, authUserMiddleware } = require('../middleware/authMiddleware');

router.get('/config', (req, res) => {
    return res.status(200).json({
        status: 'success',
        data: process.env.CLIENT_ID
    })
});

module.exports = router;