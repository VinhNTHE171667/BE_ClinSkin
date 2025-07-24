import express from "express";
import {
  getOrdersForShipping,
  updateOrderStatusByShipping,
  getOrderForShippingDetail,
} from "../../controllers/orderController.js";

const router = express.Router();

// GET /api/shipping/orders - Get orders for shipping service
router.get("/orders", getOrdersForShipping);

// GET /api/shipping/orders/:id - Get order detail for shipping service
router.get("/orders/:id", getOrderForShippingDetail);

// PUT /api/shipping/orders/:id/status - Update order status by shipping service
router.put("/orders/:id/status", updateOrderStatusByShipping);

export default router;
