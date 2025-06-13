import express from "express";
import { createBrand, deleteBrand, getAllBrand, updateBrand } from "../../controllers/brand.controller.js";
const router = express.Router();

router.get("/", getAllBrand);
router.post("/", createBrand);
router.put("/:id", updateBrand);
router.delete("/:id", deleteBrand);

export default router;
