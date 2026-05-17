const express = require("express");
const router = express.Router();
const WarehouseController = require("../controller/WarehouseController");
const { authAdminMiddleware } = require("../middleware/authMiddleware");

router.post("/create", authAdminMiddleware, WarehouseController.createWarehouseItem);
router.put("/update/:id", authAdminMiddleware, WarehouseController.updateWarehouseItem);
router.get("/get_by_id/:id", WarehouseController.getDetailWarehouseItem);
router.get("/get_all", WarehouseController.getAllWarehouseItems);
router.delete("/delete/:id", authAdminMiddleware, WarehouseController.deleteWarehouseItem);

module.exports = router;
