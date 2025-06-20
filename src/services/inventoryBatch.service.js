import InventoryBatch from "../models/inventoryBatch.model.js";
import Product from "../models/product.js";
import Counter from "../models/counter.model.js";
import mongoose from "mongoose";

class InventoryBatchService {
  async createBatch(batchData) {
    try {
      if (!batchData.batchNumber) {
        batchData.batchNumber = await Counter.generateCompactId("BN");
      }

      batchData.remainingQuantity = batchData.quantity;

      const newBatch = await InventoryBatch.create(batchData);

      await Product.findByIdAndUpdate(batchData.productId, {
        $inc: { currentStock: batchData.quantity },
      });

      return newBatch;
    } catch (error) {
      throw error;
    }
  }

  async updateBatch(batchNumber, newQuantity, expiryDate) {
    try {
      const batch = await InventoryBatch.findOne({ batchNumber });
      if (!batch) {
        throw new Error("Inventory batch not found");
      }

      if (newQuantity !== undefined) {
        const quantityChange = newQuantity - batch.quantity;

        let newRemainingQuantity = batch.remainingQuantity + quantityChange;

        const remainingQuantityChange =
          newRemainingQuantity - batch.remainingQuantity;

        batch.quantity = newQuantity;
        batch.remainingQuantity = newRemainingQuantity;

        if (remainingQuantityChange !== 0) {
          await Product.findByIdAndUpdate(batch.productId, {
            $inc: { currentStock: remainingQuantityChange },
          });
        }
      }

      if (expiryDate !== undefined) {
        batch.expiryDate = expiryDate;
      }

      await batch.save();

      return batch;
    } catch (error) {
      throw error;
    }
  }

  async getNearestExpiryBatch(productId, requiredQuantity) {
    const batches = await InventoryBatch.find({
      productId: productId,
      remainingQuantity: { $gt: 0 },
      expiryDate: { $gte: new Date() },
    }).sort({ expiryDate: 1 });
    const result = [];
    let total = 0;

    for (const batch of batches) {
      if (total >= requiredQuantity) break;
      result.push(batch);
      total += batch.remainingQuantity;
    }

    if (total < requiredQuantity) {
      throw new Error(
        `Not enough stock available for product ${productId}. Required: ${requiredQuantity}, Available: ${total}`
      );
    }

    return {items: result, total};
  }

  async deductQuantityFromBatch(batchNumber, quantity) {
    try {
      const batch = await InventoryBatch.findOne({ batchNumber });
      if (!batch) {
        throw new Error("Inventory batch not found");
      }

      if (batch.remainingQuantity < quantity) {
        throw new Error(
          `Cannot deduct ${quantity} units. Only ${batch.remainingQuantity} units remaining in batch ${batchNumber}`
        );
      }

      const newRemainingQuantity = batch.remainingQuantity - quantity;

      batch.remainingQuantity = newRemainingQuantity;
      await batch.save();

      await Product.findByIdAndUpdate(batch.productId, {
        $inc: { currentStock: -quantity },
      });

      return batch;
    } catch (error) {
      throw error;
    }
  }

  async getAllBatches() {
    return await InventoryBatch.find()
      .populate("productId")
      .populate("importer");
  }

  async getBatchByNumber(batchNumber) {
    return await InventoryBatch.findOne({ batchNumber })
      .populate("productId")
      .populate("importer");
  }

  async getBatchesByProductId(productId) {
    return await InventoryBatch.find({ productId }).sort({ expiryDate: 1 });
  }

  async deleteBatch(batchNumber) {
    try {
      const batch = await InventoryBatch.findOne({ batchNumber });
      if (!batch) {
        throw new Error("Inventory batch not found");
      }

      if (batch.remainingQuantity !== batch.quantity) {
        throw new Error("Cannot delete batch");
      }

      await Product.findByIdAndUpdate(batch.productId, {
        $inc: { currentStock: -batch.remainingQuantity },
      });

      await InventoryBatch.deleteOne({ batchNumber });

      return { success: true, message: "Inventory batch deleted successfully" };
    } catch (error) {
      throw error;
    }
  }

  async countBatches(filter = {}) {
    return await InventoryBatch.countDocuments(filter);
  }

  async getPaginatedBatches(
    filter = {},
    skip = 0,
    limit = 10,
    sort = { createdAt: -1 }
  ) {
    return await InventoryBatch.find(filter)
      .populate("productId")
      .populate("importer")
      .sort(sort)
      .skip(skip)
      .limit(limit);
  }
}

export default new InventoryBatchService();
