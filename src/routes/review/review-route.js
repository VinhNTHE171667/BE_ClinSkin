import express from "express";
import { getReview, updateReplyByAdmin,deleteReviewById,toggleDisplayReview} from "../../controllers/review.controller.js";
const router = express.Router();
router.get("/getReview", getReview);
router.put("/:id/reply", updateReplyByAdmin);
router.delete("/:id", deleteReviewById);
router.patch("/:id/toggle-display", toggleDisplayReview);
export default router;

