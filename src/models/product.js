// models/Product.js

import mongoose from 'mongoose';
import slugify from 'slugify';

const productSchema = new mongoose.Schema({
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

// Generate slug both for new documents and when updating
productSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, locale: "vi", strict: true });
  }
  next();
});

// Default query to exclude deleted products
productSchema.pre(/^find/, function(next) {
  // this refers to the current query
  if (!this.getQuery().hasOwnProperty('isDeleted')) {
    this.find({ isDeleted: false });
  }
  next();
});

const Product = mongoose.model('Product', productSchema);
export default Product;
