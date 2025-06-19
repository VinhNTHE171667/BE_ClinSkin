
import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  pid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const addressSchema = new mongoose.Schema({
  province: { type: String, required: true },
  district: { type: String, required: true },
  ward: { type: String, required: true },
  detail: { type: String, required: true }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: {
    type: [itemSchema],
    required: true,
    validate: v => Array.isArray(v) && v.length > 0
  },
  address: {
    type: addressSchema,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'],
    default: 'pending'
  },
  note: {
    type: String,
    default: ''
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'paypal', 'stripe'],
    required: true
  },
  cancelReason: {
    type: String,
    default: ''
  },
  stripeSessionId: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
