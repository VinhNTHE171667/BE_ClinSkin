import mongoose from 'mongoose';
import slugify from 'slugify';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currentStock: {
    type: Number,
    required: true,
    min: 0
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true
  },
  images: [{
    url: {
      type: String,
    },
    public_id: {
      type: String,
    }
  }],
  mainImage: {
    url: {
      type: String,
      required: true
    },
    public_id: {
      type: String,
      required: true
    }
  },
  description: {
    type: String
  },
  tags: [{
    type: String,
    trim: true,
    enum: ["NEW", "HOT"]
  }],
  totalRating: {
    type: Number,
    default: 0
  },
  ratingCount: {
    type: Number,
    default: 0
  },

  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

productSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, locale: "vi", strict: true });
  }
  next();
});

productSchema.pre(/^find/, function(next) {
  if (!this.getQuery().hasOwnProperty('isDeleted')) {
    this.find({ isDeleted: false });
  }
  next();
});

const Product = mongoose.model('Product', productSchema);
export default Product;
