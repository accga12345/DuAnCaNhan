const express = require('express');
const router = express.Router();
const OperatingCostController = require('../controller/OperatingCostController');
const { authAdminMiddleware } = require('../middleware/authMiddleware');

router.get('/get-details', OperatingCostController.getOperatingCost);
router.put('/update', authAdminMiddleware, OperatingCostController.updateOperatingCost);

module.exports = router;