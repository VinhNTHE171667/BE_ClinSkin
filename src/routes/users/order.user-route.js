import express from "express";
import { authMiddlewareUser } from "../../middleware/auth.middleware.js";
import { createOrderValidate } from "../../validates/order.validate.js";
import {
  createOrderCod,
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

export default router;
