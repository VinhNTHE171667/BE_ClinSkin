import Review from "../models/review.js";
import Product from "../models/product.js";

const escapeRegex = (string) => {
  return string.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rate, comment, images, reply, display } = req.body;
    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đánh giá hoặc bạn không có quyền chỉnh sửa",
      });
    }
    review.rate = rate || review.rate;
    review.comment = comment || review.comment;
    review.images = images || review.images;
    review.reply = reply || review.reply;
    if (display !== undefined) review.display = display;

    const updatedReview = await review.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật thông tin đánh giá thành công",
      data: updatedReview,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi cập nhật đánh giá",
      error: error.message,
    });
  }
};

export const removeReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đánh giá",
      });
    }

    await Review.findByIdAndDelete(id);
    return res.status(200).json({
      success: true,
      message: "Xóa đánh giá thành công",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi xóa đánh giá",
      error: error.message,
    });
  }
};

export const getReviewByAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const { rate, customerName, productName, fromDate, toDate } = req.query;
    const skip = (page - 1) * pageSize;
    const escapedProductName = productName ? escapeRegex(productName) : null;

    let matchStage = {};

    if (rate && parseInt(rate) > 0) {
      matchStage.rate = parseInt(rate);
    }

    if (fromDate && toDate) {
      matchStage.createdAt = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    }

    const pipeline = [
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: "$userDetails" },
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $match: {
          ...matchStage,
          ...(customerName
            ? { "userDetails.name": { $regex: customerName, $options: "i" } }
            : {}),
          ...(escapedProductName
            ? {
                "productDetails.name": {
                  $regex: escapedProductName,
                  $options: "i",
                },
              }
            : {}),
        },
      },
      {
        $project: {
          _id: 1,
          rate: 1,
          comment: 1,
          createdAt: 1,
          user: { _id: "$userDetails._id", name: "$userDetails.name" },
          product: {
            _id: "$productDetails._id",
            name: "$productDetails.name",
            mainImage: "$productDetails.mainImage",
          },
          display: 1,
          reply: 1,
          images: 1,
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          metadata: [{ $count: "total" }, { $addFields: { page, pageSize } }],
          data: [{ $skip: skip }, { $limit: pageSize }],
        },
      },
    ];

    const [result] = await Review.aggregate(pipeline);

    const reviews = result.data;
    const metadata = result.metadata[0];

    return res.status(200).json({
      success: true,
      data: reviews,
      pagination: metadata
        ? {
            page: metadata.page,
            pageSize: metadata.pageSize,
            totalPage: Math.ceil(metadata.total / metadata.pageSize),
            totalItems: metadata.total,
          }
        : {
            page: page,
            pageSize: pageSize,
            totalPage: 0,
            totalItems: 0,
          },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      data: [],
      error: error.message,
    });
  }
};
