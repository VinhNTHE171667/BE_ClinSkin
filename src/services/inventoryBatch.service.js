import InventoryBatch from "../models/inventoryBatch.model.js";
import Product from "../models/product.js";
import Counter from "../models/counter.model.js";

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

  async updateBatch(batchNumber, newQuantity, expiryDate, newRemainingQuantity) {
    try {
      const batch = await InventoryBatch.findOne({ batchNumber });
      if (!batch) {
        throw new Error("Inventory batch not found");
      }

      if (newQuantity !== undefined) {
        const quantityChange = newQuantity - batch.quantity;

        let remainingQuantity = newRemainingQuantity !== undefined ? 
          newRemainingQuantity : batch.remainingQuantity + quantityChange;

        const remainingQuantityChange = remainingQuantity - batch.remainingQuantity;

        batch.quantity = newQuantity;
        batch.remainingQuantity = remainingQuantity;

        if (remainingQuantityChange !== 0) {
          await Product.findByIdAndUpdate(batch.productId, {
            $inc: { currentStock: remainingQuantityChange },
          });
        }
      } else if (newRemainingQuantity !== undefined) {
        // Chỉ cập nhật remainingQuantity mà không thay đổi total quantity
        const remainingQuantityChange = newRemainingQuantity - batch.remainingQuantity;
        
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
      return {
        success: false,
        message: `Không đủ hàng. Yêu cầu: ${requiredQuantity}, Có sẵn: ${total}, Thiếu: ${requiredQuantity - total}`,
        total,
        shortage: requiredQuantity - total,
        availableBatches: result
      };
    }

    return {
      success: true,
      items: result,
      total
    };
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

  async deductQuantityFromBatchOnly(batchNumber, quantity) {
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

  async getProductsWithNearExpiryBatches(daysUntilExpiry = 30, page = 1, pageSize = 10) {
    try {
      const pageNumber = parseInt(page) || 1;
      const limitNumber = parseInt(pageSize) || 10;
      const skip = (pageNumber - 1) * limitNumber;

      const currentDate = new Date();
      const expiryThreshold = new Date();
      expiryThreshold.setDate(currentDate.getDate() + parseInt(daysUntilExpiry));

      const nearExpiryBatches = await InventoryBatch.find({
        expiryDate: { 
          $gte: currentDate, 
          $lte: expiryThreshold 
        },
        remainingQuantity: { $gt: 0 }
      })
      .populate({
        path: 'productId',
        select: '_id name mainImage currentStock price'
      })
      .sort({ expiryDate: 1 })
      .lean();

      const productGroups = {};
      
      nearExpiryBatches.forEach(batch => {
        const productId = batch.productId._id.toString();
        
        if (!productGroups[productId]) {
          productGroups[productId] = {
            productId: batch.productId._id,
            name: batch.productId.name,
            currentStock: batch.productId.currentStock,
            mainImage: batch.productId.mainImage,
            price: batch.productId.price,
            nearExpiryQuantity: 0,
            nearExpiryDate: batch.expiryDate,
            nearExpiryBatches: []
          };
        }

        productGroups[productId].nearExpiryQuantity += batch.remainingQuantity;

        productGroups[productId].nearExpiryBatches.push({
          batchId: batch._id,
          batchNumber: batch.batchNumber,
          expiryDate: batch.expiryDate,
          remainingQuantity: batch.remainingQuantity,
          costPrice: batch.costPrice
        });
      });

      const productsArray = Object.values(productGroups);

      const total = productsArray.length;
      const paginatedProducts = productsArray.slice(skip, skip + limitNumber);

      return {
        products: paginatedProducts,
        pagination: {
          page: pageNumber,
          totalPage: Math.ceil(total / limitNumber),
          totalItems: total,
          pageSize: limitNumber,
          hasMore: skip + limitNumber < total
        }
      };
    } catch (error) {
      throw error;
    }
  }

  async getBatchStatistics(daysUntilExpiry = 30) {
    try {
      const currentDate = new Date();
      const expiryThreshold = new Date();
      expiryThreshold.setDate(currentDate.getDate() + parseInt(daysUntilExpiry));

      const [
        totalInventoryResult,
        nearExpiryResult,
        expiredResult
      ] = await Promise.all([
        InventoryBatch.aggregate([
          {
            $match: {
              remainingQuantity: { $gt: 0 }
            }
          },
          {
            $group: {
              _id: null,
              totalBatches: { $sum: 1 },
              totalQuantity: { $sum: "$remainingQuantity" },
              totalValue: { $sum: { $multiply: ["$remainingQuantity", "$costPrice"] } }
            }
          }
        ]),

        InventoryBatch.aggregate([
          {
            $match: {
              expiryDate: { $gte: currentDate, $lte: expiryThreshold },
              remainingQuantity: { $gt: 0 }
            }
          },
          {
            $group: {
              _id: null,
              totalBatches: { $sum: 1 },
              totalQuantity: { $sum: "$remainingQuantity" },
              totalValue: { $sum: { $multiply: ["$remainingQuantity", "$costPrice"] } }
            }
          }
        ]),

        InventoryBatch.aggregate([
          {
            $match: {
              expiryDate: { $lt: currentDate },
              remainingQuantity: { $gt: 0 }
            }
          },
          {
            $group: {
              _id: null,
              totalBatches: { $sum: 1 },
              totalQuantity: { $sum: "$remainingQuantity" },
              totalValue: { $sum: { $multiply: ["$remainingQuantity", "$costPrice"] } }
            }
          }
        ])
      ]);

      return {
        totalInventory: {
          totalBatches: totalInventoryResult[0]?.totalBatches || 0,
          totalQuantity: totalInventoryResult[0]?.totalQuantity || 0,
          totalValue: totalInventoryResult[0]?.totalValue || 0
        },
        nearExpiry: {
          daysUntilExpiry,
          totalBatches: nearExpiryResult[0]?.totalBatches || 0,
          totalQuantity: nearExpiryResult[0]?.totalQuantity || 0,
          totalValue: nearExpiryResult[0]?.totalValue || 0
        },
        expired: {
          totalBatches: expiredResult[0]?.totalBatches || 0,
          totalQuantity: expiredResult[0]?.totalQuantity || 0,
          totalValue: expiredResult[0]?.totalValue || 0
        }
      };
    } catch (error) {
      throw error;
    }
  }
}

export default new InventoryBatchService();
