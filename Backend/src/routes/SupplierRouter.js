const express = require("express");
const router = express.Router();
const SupplierController = require("../controller/SupplierController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.post("/create_supplier", authMiddleware, SupplierController.createSupplier);
router.put("/update_supplier/:id", authMiddleware, SupplierController.updateSupplier);
router.get("/get_by_id/:id", SupplierController.getDetailSupplier);
router.get("/get_all", SupplierController.getAllSuppliers);
router.delete("/delete_supplier/:id", authMiddleware, SupplierController.deleteSupplier);

module.exports = router;
