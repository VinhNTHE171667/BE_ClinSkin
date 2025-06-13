import express from "express";
import {
    deleteCategory,
    createCategory,
    getAllCategory,
    updateCategory
} from "../../controllers/category.controller.js";

const router = express.Router();

router.get("/", getAllCategory);
router.post("/", createCategory);
router.delete("/:id", deleteCategory);
router.put("/:id", updateCategory);

export default router;
