const express = require("express");
const router = express.Router();
const BrandController = require("../controller/BrandController");
const { authAdminMiddleware } = require("../middleware/authMiddleware");

router.post("/create_brand", authAdminMiddleware, BrandController.createBrand);
router.put("/update_brand/:id", authAdminMiddleware, BrandController.updateBrand);
router.get("/get_by_id/:id", BrandController.getDetailBrand);
router.get("/get_all", BrandController.getAllBrands);
router.delete("/delete_brand/:id", authAdminMiddleware, BrandController.deleteBrand);

module.exports = router;
