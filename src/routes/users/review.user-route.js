import express from "express";
import { authMiddlewareUser } from "../../middleware/auth.middleware.js";
import { createReviewValidate, createReviewWithOrderValidate } from "../../validates/review.validate.js";
import { validateMiddleWare } from "../../middleware/validate.middleware.js";
import {
  createReview,
  createReviewWithOrderValidation,
  getReviewByProduct,
} from "../../controllers/review.controller.js";

const router = express.Router();

router.post(
  "/",
  authMiddlewareUser,
  createReviewValidate,
  validateMiddleWare,
  createReview
);

router.post(
  "/with-order-validation",
  authMiddlewareUser,
  createReviewWithOrderValidate,
  validateMiddleWare,
  createReviewWithOrderValidation
);

router.get("/:productId", getReviewByProduct);

export default router;
