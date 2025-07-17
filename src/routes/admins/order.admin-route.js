import express from "express";
import {
  getOrderByAdmin
} from "../../controllers/orderController.js";

const router = express.Router();

router.get("/", getOrderByAdmin);

export default router;
