import express from "express";
import { authMiddlewareUser } from "../../middleware/auth.middleware.js";
import { createOrderValidate } from "../../validates/order.validate.js";
import {
  createOrderCod,
  getOrderByUser,
  updateOrderByUser,
} from "../../controllers/orderController.js";
import { validateMiddleWare } from "../../middleware/validate.middleware.js";

const router = express.Router();

router.post(
  "/cod",
  authMiddlewareUser,
  createOrderValidate,
  validateMiddleWare,
  createOrderCod
);
router.get("/", authMiddlewareUser, getOrderByUser);
router.put("/:id", authMiddlewareUser, updateOrderByUser);

export default router;
