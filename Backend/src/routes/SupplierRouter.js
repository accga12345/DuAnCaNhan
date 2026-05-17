const express = require("express");
const router = express.Router();
const SupplierController = require("../controller/SupplierController");
const { authAdminMiddleware } = require("../middleware/authMiddleware");

router.post("/create_supplier", authAdminMiddleware, SupplierController.createSupplier);
router.put("/update_supplier/:id", authAdminMiddleware, SupplierController.updateSupplier);
router.get("/get_by_id/:id", SupplierController.getDetailSupplier);
router.get("/get_all", SupplierController.getAllSuppliers);
router.delete("/delete_supplier/:id", authAdminMiddleware, SupplierController.deleteSupplier);

module.exports = router;
