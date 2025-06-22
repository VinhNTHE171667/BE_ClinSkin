import express from "express";
import {
  getProductDetailBySlug,
  getProductHome,
} from "../../controllers/product-base.controller.js";
import { getProductById, getProducts } from "../../controllers/productController.js";

const router = express.Router();

router.get("/home", getProductHome);
router.get("/detail/:slug", getProductDetailBySlug);
router.get("/", getProducts);
router.get("/:id", getProductById)

export default router;
