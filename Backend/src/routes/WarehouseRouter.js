const express = require("express");
const router = express.Router();
const WarehouseController = require("../controller/WarehouseController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.post("/create", authMiddleware, WarehouseController.createWarehouseItem);
router.put("/update/:id", authMiddleware, WarehouseController.updateWarehouseItem);
router.get("/get_by_id/:id", WarehouseController.getDetailWarehouseItem);
router.get("/get_all", WarehouseController.getAllWarehouseItems);
router.delete("/delete/:id", authMiddleware, WarehouseController.deleteWarehouseItem);

module.exports = router;
