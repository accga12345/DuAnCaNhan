const express = require('express');
const router = express.Router();
const SliderController = require('../controller/SliderController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/add', authMiddleware, SliderController.createSlider);
router.get('/get-all', SliderController.getAllSliders);
router.delete('/delete/:id', authMiddleware, SliderController.deleteSlider);

module.exports = router;
