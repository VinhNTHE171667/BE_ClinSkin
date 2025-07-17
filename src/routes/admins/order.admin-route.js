import express from "express";
import {
  getOrderByAdmin,
  updateOrder,
  updateStatusOrderByAdmin
} from "../../controllers/orderController.js";

const router = express.Router();

router.get("/", getOrderByAdmin);
router.put("/:id", updateOrder);
router.put("/status/:id", updateStatusOrderByAdmin);

export default router;
