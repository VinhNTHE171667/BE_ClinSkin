import express from "express";
import {
  getReviewByAdmin,
  removeReview,
  updateReview,
  adminReplyReview,
} from "../../controllers/review.controller.js";

const router = express.Router();

router.get("/", getReviewByAdmin);
router.put("/:id", updateReview);
router.put("/:id/reply", adminReplyReview);
router.delete("/:id", removeReview);

export default router;
