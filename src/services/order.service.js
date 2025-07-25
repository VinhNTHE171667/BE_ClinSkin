import Order from "../models/order.js";
import Product from "../models/product.js";
import Promotion from "../models/promotion.model.js";

class OrderService {
  async getMonthlyOrderStats(year, month) {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      const result = await Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: startDate,
              $lte: endDate,
            },
          },
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            completedOrders: {
              $sum: {
                $cond: [{ $eq: ["$status", "delivered_confirmed"] }, 1, 0],
              },
            },
            totalCompletedAmount: {
              $sum: {
                $cond: [{ $eq: ["$status", "delivered_confirmed"] }, "$totalAmount", 0],
              },
            },
            totalPendingAmount: {
              $sum: {
                $cond: [
                  { $in: ["$status", ["pending", "confirmed", "picked_up", "in_transit", 
                                     "carrier_confirmed", "delivery_pending", "carrier_delivered"]] },
                  "$totalAmount",
                  0,
                ],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalOrders: 1,
            completedOrders: 1,
            totalCompletedAmount: 1,
            totalPendingAmount: 1,
            month: month,
            year: year,
          },
        },
      ]);

      if (result.length === 0) {
        return {
          totalOrders: 0,
          completedOrders: 0,
          totalCompletedAmount: 0,
          totalPendingAmount: 0,
          month: month,
          year: year,
        };
      }

      return result[0];
    } catch (error) {
      throw new Error(
        `Lỗi khi lấy thống kê đơn hàng tháng ${month}/${year}: ${error.message}`
      );
    }
  }

  // Thống kê đơn hàng các ngày trong tháng
  async getDailyOrderStatsInMonth(year, month) {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      const result = await Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: startDate,
              $lte: endDate,
            },
          },
        },
        {
          $group: {
            _id: { $dayOfMonth: "$createdAt" },
            totalOrders: { $sum: 1 },
            completedOrders: {
              $sum: {
                $cond: [{ $eq: ["$status", "delivered_confirmed"] }, 1, 0],
              },
            },
            processingOrders: {
              $sum: {
                $cond: [
                  { $in: ["$status", ["pending", "confirmed", "picked_up", "in_transit", 
                                     "carrier_confirmed", "delivery_pending", "carrier_delivered"]] },
                  1,
                  0,
                ],
              },
            },
            cancelledOrders: {
              $sum: {
                $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0],
              },
            },
          },
        },
        {
          $project: {
            day: "$_id",
            completedOrders: 1,
            processingOrders: 1,
            cancelledOrders: 1,
            _id: 0,
          },
        },
        {
          $sort: { day: 1 },
        },
      ]);

      return {
        month: month,
        year: year,
        dailyData: result.map((item) => ({
          day: item.day,
          completedOrders: item.completedOrders,
          processingOrders: item.processingOrders,
          cancelledOrders: item.cancelledOrders,
        })),
      };
    } catch (error) {
      throw new Error(
        `Lỗi khi lấy thống kê đơn hàng theo ngày tháng ${month}/${year}: ${error.message}`
      );
    }
  }

  // Thống kê đơn hàng các tháng trong năm
  async getMonthlyOrderStatsInYear(year) {
    try {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

      const result = await Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: startDate,
              $lte: endDate,
            },
          },
        },
        {
          $group: {
            _id: { $month: "$createdAt" },
            totalOrders: { $sum: 1 },
            completedOrders: {
              $sum: {
                $cond: [{ $eq: ["$status", "delivered_confirmed"] }, 1, 0],
              },
            },
            processingOrders: {
              $sum: {
                $cond: [
                  { $in: ["$status", ["pending", "confirmed", "picked_up", "in_transit", 
                                     "carrier_confirmed", "delivery_pending", "carrier_delivered"]] },
                  1,
                  0,
                ],
              },
            },
            cancelledOrders: {
              $sum: {
                $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0],
              },
            },
          },
        },
        {
          $project: {
            month: "$_id",
            completedOrders: 1,
            processingOrders: 1,
            cancelledOrders: 1,
            _id: 0,
          },
        },
        {
          $sort: { month: 1 },
        },
      ]);

      return {
        year: year,
        monthlyData: result.map((item) => ({
          month: item.month,
          completedOrders: item.completedOrders,
          processingOrders: item.processingOrders,
          cancelledOrders: item.cancelledOrders,
        })),
      };
    } catch (error) {
      throw new Error(
        `Lỗi khi lấy thống kê đơn hàng theo tháng năm ${year}: ${error.message}`
      );
    }
  }

  // Thống kê đơn hàng 5 năm gần nhất
  async getYearlyOrderStatsLastFiveYears() {
    try {
      const currentYear = new Date().getFullYear();
      const startYear = currentYear - 4;
      const startDate = new Date(startYear, 0, 1);
      const endDate = new Date(currentYear, 11, 31, 23, 59, 59, 999);

      const result = await Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: startDate,
              $lte: endDate,
            },
          },
        },
        {
          $group: {
            _id: { $year: "$createdAt" },
            totalOrders: { $sum: 1 },
            completedOrders: {
              $sum: {
                $cond: [{ $eq: ["$status", "delivered_confirmed"] }, 1, 0],
              },
            },
            processingOrders: {
              $sum: {
                $cond: [
                  { $in: ["$status", ["pending", "confirmed", "picked_up", "in_transit", 
                                     "carrier_confirmed", "delivery_pending", "carrier_delivered"]] },
                  1,
                  0,
                ],
              },
            },
            cancelledOrders: {
              $sum: {
                $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0],
              },
            },
          },
        },
        {
          $project: {
            year: "$_id",
            completedOrders: 1,
            processingOrders: 1,
            cancelledOrders: 1,
            _id: 0,
          },
        },
        {
          $sort: { year: 1 },
        },
      ]);

      const yearlyData = result.map((item) => ({
        year: item.year,
        completedOrders: item.completedOrders,
        processingOrders: item.processingOrders,
        cancelledOrders: item.cancelledOrders,
      }));

      return {
        yearRange: `${startYear}-${currentYear}`,
        yearlyData: yearlyData,
      };
    } catch (error) {
      throw new Error(
        `Lỗi khi lấy thống kê đơn hàng 5 năm gần nhất: ${error.message}`
      );
    }
  }
}

export const validateOrder = async (products) => {
  const errors = [];
  const productIds = products.map((p) => p.productId);

  const productList = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(productList.map((p) => [p._id.toString(), p]));

  for (const item of products) {
    const product = productMap.get(item.productId.toString());
    if (!product) {
      errors.push(`Không tìm thấy sản phẩm: ${item.productId}`);
      continue;
    }

    if (product.currentStock < item.quantity) {
      errors.push(
        `Sản phẩm ${product.name} hiện không khả dụng hoặc không đủ số lượng trong kho. Còn lại: ${product.currentStock}, yêu cầu: ${item.quantity}`
      );
    }

    // Kiểm tra số lượng dựa trên loại sản phẩm
    if (product.variants && product.variants.length > 0) {
      if (!item.color) {
        errors.push(`Vui lòng chọn màu sắc cho sản phẩm ${product.name}`);
        continue;
      }

      const variant = product.variants.find(
        (v) =>
          v.color.code === item.color.code || v.color.name === item.color.name
      );

      if (!variant) {
        errors.push(
          `Không tìm thấy màu sắc đã chọn cho sản phẩm ${product.name}`
        );
      } else if (variant.quantity < item.quantity) {
        errors.push(
          `Sản phẩm ${product.name} (${item.color.name}) không đủ số lượng trong kho (Yêu cầu: ${item.quantity}, Còn lại: ${variant.quantity})`
        );
      }
    } else {
      if (product.totalQuantity < item.quantity) {
        errors.push(
          `Sản phẩm ${product.name} không đủ số lượng trong kho (Yêu cầu: ${item.quantity}, Còn lại: ${product.totalQuantity})`
        );
      }
    }
  }

  return errors;
};

export const updateProductInventory = async (products, session) => {
  for (const item of products) {
    // Sử dụng $inc để giảm currentStock
    const result = await Product.findByIdAndUpdate(
      item.pid,
      { $inc: { currentStock: -item.quantity } },
      { session, new: true }
    );

    // Kiểm tra currentStock không âm
    if (result.currentStock <= 0) {
      throw new Error(`Sản phẩm ${result.name} không đủ số lượng trong kho`);
    }
  }
};

// export const calculateOrderAmount = async (
//   products,
//   currentDate = new Date()
// ) => {
//   let totalAmount = 0;
//   let calculatedProducts = [];

//   // Lấy thông tin sản phẩm và khuyến mãi trong một lần query
//   const productIds = products.map((item) => item.productId);
//   const [productList, activePromotions] = await Promise.all([
//     Product.find({ _id: { $in: productIds } }),
//     Promotion.find({
//       "products.pid": { $in: productIds },
//       startDate: { $lte: currentDate },
//       endDate: { $gte: currentDate },
//       isActive: true,
//     }),
//   ]);

//   // Tạo map để tra cứu nhanh
//   const productMap = new Map(productList.map((p) => [p._id.toString(), p]));
//   const promotionMap = new Map();

//   activePromotions.forEach((promo) => {
//     promo.products.forEach((p) => {
//       promotionMap.set(p.pid.toString(), {
//         promotion: promo,
//         discount: p.discount,
//       });
//     });
//   });

//   for (const item of products) {
//     const product = productMap.get(item.productId.toString());
//     if (!product) {
//       throw new Error(`Không tìm thấy sản phẩm: ${item.productId}`);
//     }

//     // Kiểm tra tồn kho
//     let availableQuantity;
//     availableQuantity = product.currentStock || product.totalQuantity;
//     if (availableQuantity < item.quantity) {
//       throw new Error(
//         `Sản phẩm ${product.name} không đủ số lượng trong kho (Yêu cầu: ${item.quantity}, Còn lại: ${availableQuantity})`
//       );
//     }

//     // Tính giá với khuyến mãi nếu có
//     let finalPrice = product.price;
//     let discountAmount = 0;
//     const promotionInfo = promotionMap.get(item.productId.toString());

//     if (promotionInfo) {
//       const { discount } = promotionInfo;

//       // Tính giảm giá theo phần trăm
//       discountAmount = (product.price * discount) / 100;
//       finalPrice = product.price - discountAmount;
//     }

//     const subtotal = finalPrice * item.quantity;
//     totalAmount += subtotal;

//     calculatedProducts.push({
//       pid: item.productId,
//       quantity: item.quantity,
//       price: finalPrice,
//       originalPrice: product.price,
//       discountAmount: discountAmount * item.quantity,
//       // Thông tin bổ sung (không lưu vào DB)
//       name: product.name,
//       image: product.mainImage?.url,
//       subtotal,
//     });
//   }

//   return {
//     products: calculatedProducts,
//     totalAmount: Math.round(totalAmount),
//   };
// };

export const calculateOrderAmount = async (
  products,
  currentDate = new Date()
) => {
  let totalAmount = 0;
  let calculatedProducts = [];

  // Lấy thông tin sản phẩm và khuyến mãi trong một lần query
  const productIds = products.map((item) => item.productId);
  const [productList, activePromotions] = await Promise.all([
    Product.find({ _id: { $in: productIds } }),
    Promotion.find({
      "products.product": { $in: productIds },
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
      isActive: true,
    }),
  ]);

  // Tạo map để tra cứu nhanh
  const productMap = new Map(productList.map((p) => [p._id.toString(), p]));
  const promotionMap = new Map();

  // Sửa logic map promotion
  activePromotions.forEach((promo) => {
    promo.products.forEach((p) => {
      promotionMap.set(p.product.toString(), {
        promotion: promo,
        discountPercentage: p.discountPercentage,
        maxDiscountAmount: p.maxDiscountAmount,
      });
    });
  });

  for (const item of products) {
    const product = productMap.get(item.productId.toString());
    if (!product) {
      throw new Error(`Không tìm thấy sản phẩm: ${item.productId}`);
    }

    // Kiểm tra tồn kho
    let availableQuantity = product.currentStock || product.totalQuantity;
    if (availableQuantity < item.quantity) {
      throw new Error(
        `Sản phẩm ${product.name} không đủ số lượng trong kho (Yêu cầu: ${item.quantity}, Còn lại: ${availableQuantity})`
      );
    }

    // Tính giá với khuyến mãi nếu có
    let finalPrice = product.price;
    let discountAmount = 0;
    const promotionInfo = promotionMap.get(item.productId.toString());

    if (promotionInfo) {
      const { discountPercentage, maxDiscountAmount } = promotionInfo;

      // Tính giảm giá theo phần trăm
      discountAmount = (product.price * discountPercentage) / 100;
      
      // Áp dụng giới hạn giảm giá tối đa nếu có
      if (maxDiscountAmount > 0) {
        discountAmount = Math.min(discountAmount, maxDiscountAmount);
      }
      
      finalPrice = product.price - discountAmount;
    }

    const subtotal = finalPrice * item.quantity;
    totalAmount += subtotal;

    calculatedProducts.push({
      pid: item.productId,
      quantity: item.quantity,
      price: finalPrice, // Giá đã giảm
      originalPrice: product.price,
      discountAmount: discountAmount * item.quantity,
      // Thông tin bổ sung (không lưu vào DB)
      name: product.name,
      image: product.mainImage?.url,
      subtotal,
    });
  }

  return {
    products: calculatedProducts,
    totalAmount: Math.round(totalAmount),
  };
};

export const restoreProductQuantity = async (orderProducts) => {
  try {
    if (!Array.isArray(orderProducts) || orderProducts.length === 0) {
      return {
        success: false,
        message: "Không có sản phẩm để hoàn lại số lượng",
      };
    }

    const bulkOps = orderProducts.map((product) => ({
      updateOne: {
        filter: {
          _id: product.pid,
        },
        update: {
          $inc: {
            currentStock: product.quantity,
          },
        },
      },
    }));

    const result = await Product.bulkWrite(bulkOps);
    return {
      success: true,
      modifiedCount: result.modifiedCount,
      message: `Đã hoàn lại số lượng cho ${result.modifiedCount} sản phẩm`,
    };
  } catch (error) {
    console.error("Lỗi khi hoàn lại số lượng sản phẩm:", error);
    return {
      success: false,
      error: error.message,
      message: "Có lỗi xảy ra khi hoàn lại số lượng sản phẩm",
    };
  }
};

export default new OrderService();
