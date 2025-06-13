import mongoose from 'mongoose';

export const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
    },
    images: {
      type: [String], 
      default: [],
    },
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
      default: '',
    },
  },
  {
    timestamps: true, 
  }
);

const Review = mongoose.model('Reviews', reviewSchema);

export default Review;
