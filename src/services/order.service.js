import Product from "../models/product.js";
import Promotion from "../models/promotion.js";

export const validateOrder = async (products) => {
  const errors = [];
  const productIds = products.map(p => p.productId);

  const productList = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(productList.map(p => [p._id.toString(), p]));

  for (const item of products) {
    const product = productMap.get(item.productId.toString());
    if (!product) {
      errors.push(`Không tìm thấy sản phẩm: ${item.productId}`);
      continue;
    }

    if (product.currentStock < item.quantity) {
      errors.push(`Sản phẩm ${product.name} hiện không khả dụng hoặc không đủ số lượng trong kho. Còn lại: ${product.currentStock}, yêu cầu: ${item.quantity}`);
    }

    // Kiểm tra số lượng dựa trên loại sản phẩm
    if (product.variants && product.variants.length > 0) {
      if (!item.color) {
        errors.push(`Vui lòng chọn màu sắc cho sản phẩm ${product.name}`);
        continue;
      }

      const variant = product.variants.find(v =>
        v.color.code === item.color.code ||
        v.color.name === item.color.name
      );

      if (!variant) {
        errors.push(`Không tìm thấy màu sắc đã chọn cho sản phẩm ${product.name}`);
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

export const calculateOrderAmount = async (products, currentDate = new Date()) => {
  let totalAmount = 0;
  let calculatedProducts = [];

  // Lấy thông tin sản phẩm và khuyến mãi trong một lần query
  const productIds = products.map(item => item.productId);
  const [productList, activePromotions] = await Promise.all([
    Product.find({ _id: { $in: productIds } }),
    Promotion.find({
      'products.pid': { $in: productIds },
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
      isActive: true
    })
  ]);

  // Tạo map để tra cứu nhanh
  const productMap = new Map(productList.map(p => [p._id.toString(), p]));
  const promotionMap = new Map();

  activePromotions.forEach(promo => {
    promo.products.forEach(p => {
      promotionMap.set(p.pid.toString(), {
        promotion: promo,
        discount: p.discount
      });
    });
  });

  for (const item of products) {
    const product = productMap.get(item.productId.toString());
    if (!product) {
      throw new Error(`Không tìm thấy sản phẩm: ${item.productId}`);
    }

    // Kiểm tra tồn kho
    let availableQuantity;
    availableQuantity = product.currentStock || product.totalQuantity;
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
      const { discount } = promotionInfo;

      // Tính giảm giá theo phần trăm
      discountAmount = (product.price * discount) / 100;
      finalPrice = product.price - discountAmount;
    }

    const subtotal = finalPrice * item.quantity;
    totalAmount += subtotal;

    calculatedProducts.push({
      pid: item.productId,
      quantity: item.quantity,
      price: finalPrice,
      originalPrice: product.price,
      discountAmount: discountAmount * item.quantity,
      // Thông tin bổ sung (không lưu vào DB)
      name: product.name,
      image: product.mainImage?.url,
      subtotal
    });
  }

  return {
    products: calculatedProducts,
    totalAmount: Math.round(totalAmount)
  };
};