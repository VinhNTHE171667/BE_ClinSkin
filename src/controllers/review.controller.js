import Review from "../models/review.js";
import User from "../models/user.model.js";
export const getReview = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const content = req.query.content || "";

    const filter = content
      ? { comment: { $regex: content, $options: "i" } }
      : {};

    const totalItems = await Review.countDocuments(filter);
    const reviews = await Review.find(filter)
      .populate("productId", "name") 
      .populate("userId", "name")    
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Lấy danh sách review thành công",
      data: {
        reviews,
        pagination: {
          page,
          pageSize,
          totalItems,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const updateReplyByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;

    if (!reply || reply.trim().length === 0) {
      return res.status(400).json({ message: "Reply không được để trống." });
    }

    const updatedReview = await Review.findByIdAndUpdate(
      id,
      { reply },
      { new: true }
    );

    if (!updatedReview) {
      return res.status(404).json({ message: "Không tìm thấy review!" });
    }

    res.status(200).json({
      message: "Cập nhật phản hồi thành công!",
      data: updatedReview,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const deleteReviewById = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedReview = await Review.findByIdAndDelete(id);

    if (!deletedReview) {
      return res.status(404).json({ message: "Không tìm thấy review để xoá." });
    }

    res.status(200).json({ message: "Xoá review thành công.", data: deletedReview });
  } catch (error) {
    res.status(500).json({ message: "Lỗi xoá review.", error: error.message });
  }
};
export const toggleDisplayReview = async (req, res) => {
  const { id } = req.params;
  try {
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: "Review không tồn tại" });
    }

    review.display = !review.display;
    await review.save();

    res.status(200).json({ message: "Đã cập nhật trạng thái hiển thị", review });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};