import express from "express";
import {
  getProductDetailBySlug,
  getProductHome,
} from "../../controllers/product-base.controller.js";

const router = express.Router();

router.get("/home", getProductHome);
router.get("/detail/:slug", getProductDetailBySlug);

export default router;
