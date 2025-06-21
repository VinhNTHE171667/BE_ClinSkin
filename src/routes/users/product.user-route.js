import express from "express";
import {
  getProductHome,
} from "../../controllers/product-base.controller.js";

const router = express.Router();

router.get("/home", getProductHome);

export default router;
