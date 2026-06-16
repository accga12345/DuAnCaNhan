const express = require('express');
const router = express.Router();
const SliderController = require('../controller/SliderController');
const { authAdminMiddleware } = require('../middleware/authMiddleware');

router.post('/add', authAdminMiddleware, SliderController.createSlider);
router.get('/get-all', SliderController.getAllSliders);
router.delete('/delete/:id', authAdminMiddleware, SliderController.deleteSlider);

module.exports = router;
