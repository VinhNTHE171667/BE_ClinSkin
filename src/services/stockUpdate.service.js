import Product from '../models/product.js';
import InventoryBatch from '../models/inventoryBatch.model.js';
import Order from '../models/order.js';

/**
 * Cập nhật currentStock cho tất cả sản phẩm
 * currentStock = tổng remainingQuantity (chưa hết hạn) - số lượng trong đơn hàng pending
 */
export const updateAllProductsStock = async () => {
  try {
    const products = await Product.find({ isDeleted: false }).select('_id name');
    
    for (const product of products) {
      await updateProductStock(product._id);
    }

  } catch (error) {
    console.error('error updating all products stock:', error);
    throw error;
  }
};

export const updateProductStock = async (productId) => {
  try {
    const currentDate = new Date();
    
    const validBatches = await InventoryBatch.aggregate([
      {
        $match: {
          productId: productId,
          expiryDate: { $gt: currentDate }, 
          remainingQuantity: { $gt: 0 } 
        }
      },
      {
        $group: {
          _id: null,
          totalRemainingQuantity: { $sum: '$remainingQuantity' }
        }
      }
    ]);
    
    const totalRemainingQuantity = validBatches.length > 0 ? validBatches[0].totalRemainingQuantity : 0;
    
    const pendingOrders = await Order.aggregate([
      {
        $match: {
          status: 'pending'
        }
      },
      {
        $unwind: '$products'
      },
      {
        $match: {
          'products.pid': productId
        }
      },
      {
        $group: {
          _id: null,
          totalPendingQuantity: { $sum: '$products.quantity' }
        }
      }
    ]);
    
    const totalPendingQuantity = pendingOrders.length > 0 ? pendingOrders[0].totalPendingQuantity : 0;
    
    const newCurrentStock = Math.max(0, totalRemainingQuantity - totalPendingQuantity);
    
    await Product.findByIdAndUpdate(
      productId,
      { currentStock: newCurrentStock },
      { new: true }
    );
    
    return {
      productId,
      totalRemainingQuantity,
      totalPendingQuantity,
      newCurrentStock
    };
    
  } catch (error) {
    console.error(`Lỗi khi cập nhật stock cho sản phẩm ${productId}:`, error);
    throw error;
  }
};
