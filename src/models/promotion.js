
import mongoose from 'mongoose';
import slugify from 'slugify';

const promotionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
    slug: {
    type: String,
    unique: true,
    lowercase: true
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
        min: 0 
      }
    }
  ]
}, {
  timestamps: true
});

promotionSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, locale: "vi", strict: true });
  }
  next();
});


const Promotion = mongoose.model('Promotion', promotionSchema);
export default Promotion;