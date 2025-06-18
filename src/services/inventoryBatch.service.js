import InventoryBatch from '../models/inventoryBatch.model.js';
import Product from '../models/product.js';
import Counter from '../models/counter.model.js';
import mongoose from 'mongoose';

class InventoryBatchService {
  // Create a new inventory batch
  async createBatch(batchData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Generate a batch number if not provided
      if (!batchData.batchNumber) {
        batchData.batchNumber = await Counter.generateCompactId("BN");
      }

      // Set remainingQuantity equal to quantity
      batchData.remainingQuantity = batchData.quantity;

      // Create the new inventory batch
      const newBatch = await InventoryBatch.create([batchData], { session });

      // Update the product's currentStock
      await Product.findByIdAndUpdate(
        batchData.productId,
        { $inc: { currentStock: batchData.quantity } },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return newBatch[0];
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  // Update an inventory batch (quantity and expiry date)
  async updateBatch(batchNumber, newQuantity, expiryDate) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get the current batch by batchNumber
      const batch = await InventoryBatch.findOne({ batchNumber }).session(session);
      if (!batch) {
        throw new Error('Inventory batch not found');
      }

      // Handle quantity update if provided
      if (newQuantity !== undefined) {
        // Calculate quantity change
        const quantityChange = newQuantity - batch.quantity;
        
        // Calculate new remainingQuantity
        let newRemainingQuantity = batch.remainingQuantity + quantityChange;
        
        // Calculate the actual change in remainingQuantity
        const remainingQuantityChange = newRemainingQuantity - batch.remainingQuantity;

        // Update batch with new quantity and calculated remainingQuantity
        batch.quantity = newQuantity;
        batch.remainingQuantity = newRemainingQuantity;

        // Update product's currentStock based on the change in remainingQuantity
        if (remainingQuantityChange !== 0) {
          await Product.findByIdAndUpdate(
            batch.productId,
            { $inc: { currentStock: remainingQuantityChange } },
            { session }
          );
        }
      }

      // Handle expiry date update if provided
      if (expiryDate !== undefined) {
        batch.expiryDate = expiryDate;
      }

      // Save the updated batch
      await batch.save({ session });

      await session.commitTransaction();
      session.endSession();

      return batch;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  // Deduct quantity from batch's remaining quantity
  async deductQuantityFromBatch(batchNumber, quantity) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get the current batch by batchNumber
      const batch = await InventoryBatch.findOne({ batchNumber }).session(session);
      if (!batch) {
        throw new Error('Inventory batch not found');
      }

      // Check if we have enough remaining quantity
      if (batch.remainingQuantity < quantity) {
        throw new Error(`Cannot deduct ${quantity} units. Only ${batch.remainingQuantity} units remaining in batch ${batchNumber}`);
      }

      // Calculate new remainingQuantity
      const newRemainingQuantity = batch.remainingQuantity - quantity;
      
      // Update batch with new remainingQuantity
      batch.remainingQuantity = newRemainingQuantity;
      await batch.save({ session });

      // Update product's currentStock by reducing the deducted amount
      await Product.findByIdAndUpdate(
        batch.productId,
        { $inc: { currentStock: -quantity } },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return batch;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  // Get all inventory batches
  async getAllBatches() {
    return await InventoryBatch.find().populate('productId').populate('importer');
  }

  // Get inventory batch by batchNumber
  async getBatchByNumber(batchNumber) {
    return await InventoryBatch.findOne({ batchNumber }).populate('productId').populate('importer');
  }

  // Get inventory batches by product ID
  async getBatchesByProductId(productId) {
    return await InventoryBatch.find({ productId }).sort({ expiryDate: 1 });
  }

  // Delete an inventory batch
  async deleteBatch(batchNumber) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get the batch to be deleted
      const batch = await InventoryBatch.findOne({ batchNumber }).session(session);
      if (!batch) {
        throw new Error('Inventory batch not found');
      }

      if (batch.remainingQuantity !== batch.quantity) {
        throw new Error('Cannot delete batch');
      }

      // Update product's currentStock by subtracting the remainingQuantity
      await Product.findByIdAndUpdate(
        batch.productId,
        { $inc: { currentStock: -batch.remainingQuantity } },
        { session }
      );

      // Delete the batch
      await InventoryBatch.deleteOne({ batchNumber }).session(session);

      await session.commitTransaction();
      session.endSession();

      return { success: true, message: 'Inventory batch deleted successfully' };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  // Count batches based on filter
  async countBatches(filter = {}) {
    return await InventoryBatch.countDocuments(filter);
  }

  // Get paginated batches with filter and sorting
  async getPaginatedBatches(filter = {}, skip = 0, limit = 10, sort = { createdAt: -1 }) {
    return await InventoryBatch.find(filter)
      .populate('productId')
      .populate('importer')
      .sort(sort)
      .skip(skip)
      .limit(limit);
  }
}

export default new InventoryBatchService();
