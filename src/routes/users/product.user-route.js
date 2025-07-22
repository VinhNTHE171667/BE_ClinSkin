import express from "express";
import {
  getAllProductByUser,
  getListFromBrand,
  getListFromCategory,
  getProductDetailBySlug,
  getProductFilters,
  getProductHome,
  getProductPromotion,
  getProductSearch
} from "../../controllers/product-base.controller.js";
import { getProducts } from "../../controllers/productController.js";

const router = express.Router();

router.get("/home", getProductHome);
router.get("/search", getProductSearch);
router.get("/detail/:slug", getProductDetailBySlug);
router.get("/", getProducts);
router.get("/all-other", getAllProductByUser);
router.get("/promotions", getProductPromotion);
router.get("/filter-options", getProductFilters);
router.get("/brands/:slug", getListFromBrand);
router.get("/categories/:slug", getListFromCategory);


export default router;
