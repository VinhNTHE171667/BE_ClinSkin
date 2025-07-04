import express from "express";
import {
  getAllProductByUser,
  getListFromBrand,
  getProductDetailBySlug,
  getProductFilters,
  getProductHome,
} from "../../controllers/product-base.controller.js";
import { getProducts } from "../../controllers/productController.js";

const router = express.Router();

router.get("/home", getProductHome);
router.get("/detail/:slug", getProductDetailBySlug);
router.get("/", getProducts);
router.get("/all-other", getAllProductByUser);
router.get("/filter-options", getProductFilters);
router.get("/brands/:slug", getListFromBrand);

export default router;
