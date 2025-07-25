import express from "express";
import { authMiddlewareUser } from "../../middleware/auth.middleware.js";
import { createOrderValidate } from "../../validates/order.validate.js";
import {
  createOrderCod,
  getOrderByUser,
  getOrderDetailByUser,
  updateOrderByUser,
  updateStatusOrderByUser,
  createOrderStripe,
  orderStripeReturn
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
router.post(
  "/stripe",
  authMiddlewareUser,
  createOrderValidate,
  validateMiddleWare,
  createOrderStripe
);
router.get("/", authMiddlewareUser, getOrderByUser);
router.get("/detail/:id", authMiddlewareUser, getOrderDetailByUser);
router.put("/:id", authMiddlewareUser, updateOrderByUser);
router.put("/status/:id", authMiddlewareUser, updateStatusOrderByUser);
router.get("/stripe-return", authMiddlewareUser, orderStripeReturn);

export default router;
