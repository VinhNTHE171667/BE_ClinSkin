import Promotion from "../models/promotion.model.js";
import Product from "../models/product.js";

export const updatePromotionAfterOrder = async (products) => {
  try {
    const currentDate = new Date();
    const updatedPromotions = new Set(); 

    for (const item of products) {
      const product = await Product.findById(item.pid);
      if (!product) {
        console.log(`⚠️ Không tìm thấy sản phẩm: ${item.pid}`);
        continue;
      }

      const promotion = await Promotion.findOne({
        "products.product": item.pid,
        startDate: { $lte: currentDate },
        endDate: { $gte: currentDate },
        isActive: true,
      });

      if (promotion) {
        console.log("Khuyến mái:", promotion);
        
        const productIndex = promotion.products.findIndex(
          (p) => p.product.toString() === item.pid.toString()
        );

        if (productIndex !== -1) {
          const promotionProduct = promotion.products[productIndex];
          const newUsedQty = promotionProduct.usedQty + item.quantity;

          const remainingQty =
            promotionProduct.maxQty - promotionProduct.usedQty;

          if (remainingQty < item.quantity) {
            console.log(
              `⚠️ Khuyến mãi "${promotion.name}" - Sản phẩm ${product.name} vượt quá số lượng cho phép (Yêu cầu: ${item.quantity}, Còn lại: ${remainingQty})`
            );
          }

          promotion.products[productIndex].usedQty = Math.min(
            newUsedQty,
            promotionProduct.maxQty
          );

          const allProductsExhausted = promotion.products.every(
            (p) => p.usedQty >= p.maxQty
          );

          if (allProductsExhausted) {
            promotion.isActive = false;
            console.log(
              `🔚 Khuyến mãi "${promotion.name}" đã bị tắt do hết số lượng cho tất cả sản phẩm`
            );
          }

          updatedPromotions.add(promotion);
        }
      }
    }

    const updatePromises = Array.from(updatedPromotions).map(
      async (promotion) => {
        try {
          await promotion.save();
          console.log(`✅ Đã cập nhật khuyến mãi "${promotion.name}"`);
        } catch (error) {
          console.error(
            `❌ Lỗi khi cập nhật khuyến mãi "${promotion.name}":`,
            error
          );
        }
      }
    );

    await Promise.all(updatePromises);
  } catch (error) {
    console.error("💥 Lỗi khi cập nhật khuyến mãi sau đơn hàng:", error);
    throw error;
  }
};

// ✅ FIX: Helper function để check promotion status
export const getPromotionStatus = async (promotionId) => {
  try {
    const promotion = await Promotion.findById(promotionId);
    if (!promotion) {
      return null;
    }

    const currentDate = new Date();
    const isTimeValid = promotion.startDate <= currentDate && promotion.endDate >= currentDate;
    
    const productStats = promotion.products.map(p => ({
      productId: p.product,
      used: p.usedQty || 0,
      max: p.maxQty,
      available: p.maxQty - (p.usedQty || 0),
      exhausted: (p.usedQty || 0) >= p.maxQty
    }));

    const allExhausted = productStats.every(p => p.exhausted);

    return {
      id: promotion._id,
      name: promotion.name,
      isActive: promotion.isActive,
      isTimeValid,
      allExhausted,
      productStats,
      shouldBeActive: isTimeValid && !allExhausted
    };

  } catch (error) {
    console.error("Error getting promotion status:", error);
    return null;
  }
};