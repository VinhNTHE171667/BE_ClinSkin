import express from "express";
import { getBatchItemsByOrderId, createSalesHistory } from "../../controllers/productSalesHistory.controller.js";
import { authMiddlewareAdmin } from "../../middleware/auth.middleware.js";
import { validateMiddleWare } from "../../middleware/validate.middleware.js";
import { createSalesHistoryValidation } from "../../validates/salesHistory.validate.js";

const router = express.Router();

router.get("/batch-items/:orderId", authMiddlewareAdmin(["ADMIN"]), getBatchItemsByOrderId);
router.post("/create", authMiddlewareAdmin(["ADMIN"]), createSalesHistoryValidation, validateMiddleWare, createSalesHistory);

export default router;
