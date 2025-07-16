import mongoose from "mongoose";
const ProductSalesHistorySchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    saleDate: {
      type: Date,
      default: Date.now,
    },
    quantity: {
      type: Number,
      required: true,
    },
    salePrice: {
      type: Number,
      required: true,
    },
    costDetails: [
      {
        batchNumber: { type: String, required: true },
        quantityTaken: { type: Number, required: true },
        costPrice: { type: Number, required: true },
      },
    ],
    totalCost: {
      type: Number,
      required: true,
    },
    totalRevenue: {
      type: Number,
      required: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
const ProductSalesHistory = mongoose.model(
  "ProductSalesHistory",
  ProductSalesHistorySchema
);
export default ProductSalesHistory;