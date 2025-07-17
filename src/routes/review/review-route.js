import express from "express";
import { getReview, updateReplyByAdmin,deleteReviewById,toggleDisplayReview} from "../../controllers/review.controller.js";
const router = express.Router();
router.get("/getReview", getReview);v  // lấy danh sách review
router.put("/:id/reply", updateReplyByAdmin); // cập nhật phản hồi
router.delete("/:id", deleteReviewById); // xóa review
router.patch("/:id/toggle-display", toggleDisplayReview); // đổi trạng thái hiển thị
export default router;

