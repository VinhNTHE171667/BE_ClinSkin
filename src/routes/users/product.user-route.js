import express from "express";
import {
  getAllProductByUser,
  getProductDetailBySlug,
  getProductHome,
} from "../../controllers/product-base.controller.js";
import { getProducts } from "../../controllers/productController.js";

const router = express.Router();

router.get("/home", getProductHome);
router.get("/detail/:slug", getProductDetailBySlug);
router.get("/", getProducts);
router.get("/all-other", getAllProductByUser);

export default router;
