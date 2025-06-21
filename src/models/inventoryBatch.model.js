import mongoose from "mongoose";

const inventoryBatchSchema = new mongoose.Schema({
  batchNumber: {
    type: String,
    required: true,
    unique: true,
  },
  importer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0
  },
  remainingQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  expiryDate: {
    type:Date,
    required: true
  },
  receivedDate: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });
const InventoryBatch = mongoose.model("InventoryBatch", inventoryBatchSchema);
export default InventoryBatch;