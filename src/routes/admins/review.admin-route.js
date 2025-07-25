import express from "express";
import {
  getReviewByAdmin,
  removeReview,
  updateReview,
  adminReplyReview,
} from "../../controllers/review.controller.js";
import { authMiddlewareAdmin } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getReviewByAdmin);
router.put("/:id", updateReview);
router.put("/:id/reply", authMiddlewareAdmin(["ADMIN", "STAFF"]), adminReplyReview);
router.delete("/:id", removeReview);

export default router;
