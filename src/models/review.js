import mongoose from "mongoose";

export const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    rate: {
      type: Number,
      required: true,
      enum: [1, 2, 3, 4, 5],
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          required: true,
        },
      },
    ],
    comment: {
      type: String,
      required: true,
    },
    display: {
      type: Boolean,
      default: true,
    },
    reply: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

async function updateProductRating(productId) {
  try {
    const Product = mongoose.model('Product');
    const Review = mongoose.model('Reviews');
    
    const stats = await Review.aggregate([
      { $match: { productId: productId, display: true } },
      {
        $group: {
          _id: '$productId',
          totalRating: { $sum: '$rate' },
          ratingCount: { $sum: 1 }
        }
      }
    ]);

    if (stats.length > 0) {
      await Product.findByIdAndUpdate(productId, {
        totalRating: stats[0].totalRating,
        ratingCount: stats[0].ratingCount
      });
    } else {
      await Product.findByIdAndUpdate(productId, {
        totalRating: 0,
        ratingCount: 0
      });
    }
  } catch (error) {
    console.error('Error updating product rating:', error);
  }
}

// Trigger sau khi tạo review mới
reviewSchema.post('save', async function(doc) {
  await updateProductRating(doc.productId);
});

// Trigger sau khi cập nhật review
reviewSchema.post('findOneAndUpdate', async function(doc) {
  if (doc) {
    await updateProductRating(doc.productId);
  }
});

// Trigger sau khi xóa review
reviewSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    await updateProductRating(doc.productId);
  }
});

const Review = mongoose.model("Reviews", reviewSchema);

export default Review;
