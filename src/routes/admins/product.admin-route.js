import express from "express";
import { searchProductByName } from "../../controllers/productController.js";

const router = express.Router();

router.get('/search', searchProductByName);

export default router;