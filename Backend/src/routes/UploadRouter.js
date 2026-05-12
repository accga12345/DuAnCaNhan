const express = require('express');
const router = express.Router();
const uploadCloud = require('../config/cloudinaryConfig');

router.post('/', uploadCloud.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ status: 'error', message: 'No file uploaded' });
    }
    return res.status(200).json({
        status: 'success',
        url: req.file.path
    });
});

module.exports = router;