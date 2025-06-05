// models/Promotion.js

import mongoose from 'mongoose';

const promotionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  products: [
    {
      pid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // liên kết tới bảng Product
        required: true
      },
      discount: {
        type: Number,
        required: true,
        min: 0 // có thể là % hoặc số tiền, tuỳ bạn xử lý logic
      }
    }
  ]
}, {
  timestamps: true
});

const Promotion = mongoose.model('Promotion', promotionSchema);
export default Promotion;