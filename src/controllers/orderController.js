import Order from "../models/order.js";
import User from "../models/user.model.js";
import ProductSalesHistory from "../models/ProductSalesHistory.model.js";
import mongoose from "mongoose";
import {
  calculateOrderAmount,
  restoreProductQuantity,
  updateProductInventory,
  validateOrder,
} from "../services/order.service.js";
import inventoryBatchService from "../services/inventoryBatch.service.js";
import Product from "../models/product.js";
import dotenv from "dotenv";
import Stripe from "stripe";
import { updatePromotionAfterOrder } from "../services/promotion.service.js";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// GET /api/orders
export const getAllOrders = async (req, res) => {
  try {
    const {
      userId,
      status,
      paymentMethod,
      note,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      order = "desc",
      startDate,
    } = req.query;

    const query = {};

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      query.userId = userId;
    }

    if (status) {
      query.status = status;
    }

    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    if (note) {
      query.note = { $regex: note, $options: "i" };
    }

    const pageNumber = Math.max(parseInt(page), 1);
    const pageSize = Math.max(parseInt(limit), 1);

    const sortOption = {};
    const allowedSortFields = ["createdAt", "totalAmount"];
    const allowedOrder = ["asc", "desc"];

    if (allowedSortFields.includes(sortBy) && allowedOrder.includes(order)) {
      sortOption[sortBy] = order === "asc" ? 1 : -1;
    } else {
      sortOption.createdAt = -1;
    }

    if (startDate) {
      query.createdAt = {
        $gte: new Date(startDate),
      };
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("userId", "name email")
        .populate("products.pid", "name price mainImage")
        .sort(sortOption)
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize),
      Order.countDocuments(query),
    ]);

    res.status(200).json({
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / pageSize),
      pageSize,
      orders,
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Lỗi khi lấy danh sách đơn hàng", detail: err.message });
  }
};

// GET /api/orders/:id
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID đơn hàng không hợp lệ" });
    }

    const order = await Order.findById(id)
      .populate("userId", "name email")
      .populate("products.pid", "name price");

    if (!order) {
      return res.status(404).json({ error: "Không tìm thấy đơn hàng" });
    }

    res.status(200).json(order);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Lỗi khi lấy chi tiết đơn hàng", detail: err.message });
  }
};

export const createOrderCod = async (req, res) => {
  try {
    const user = req.user;
    console.log("userId", user);

    const { name, products, phone, address, addressDetail, note } = req.body;

    // Validate đơn hàng
    const validationErrors = await validateOrder(products);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors[0] || "Đơn hàng không hợp lệ",
        errors: validationErrors,
      });
    }

    // Tính toán giá và xử lý sản phẩm
    const { totalAmount, products: processedProducts } =
      await calculateOrderAmount(products);

    // Tạo đơn hàng mới
    const newOrder = new Order({
      userId: user._id,
      name,
      products: processedProducts,
      phone,
      address: address,
      addressDetail,
      paymentMethod: "cod",
      totalAmount,
      note: note || "KHÔNG CÓ",
      statusHistory: [
        {
          status: "pending",
          updatedBy: user._id,
          updatedByModel: "User",
          date: new Date(),
        },
      ],
    });

    // Lưu đơn hàng
    await newOrder.save();

    // Cập nhật số lượng sản phẩm
    await updateProductInventory(processedProducts);

    // Cập nhật thông tin khuyến mãi
    await updatePromotionAfterOrder(processedProducts);

    res.status(201).json({
      success: true,
      message: "Đặt hàng thành công",
      data: newOrder,
    });
  } catch (error) {
    console.log("Error create order COD", error);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi đặt hàng",
      error: error.message,
    });
  }
};

export const createOrderStripe = async (req, res) => {
  try {
    const user = req.user;

    const { name, products, phone, address, addressDetail, note } = req.body;

    // Validate địa chỉ theo Order schema
    if (!address || !address.province || !address.district || !address.ward) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp đầy đủ thông tin địa chỉ (tỉnh, huyện, xã)",
      });
    }

    // Validate đơn hàng
    const validationErrors = await validateOrder(products);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors[0] || "Đơn hàng không hợp lệ",
        errors: validationErrors,
      });
    }

    // Tính toán giá và xử lý sản phẩm
    const { totalAmount, products: processedProducts } =
      await calculateOrderAmount(products);

    console.log("Order calculation:", {
      totalAmount,
      productCount: processedProducts.length,
    });

    // Validate inventory availability
    await validateInventoryAvailability(processedProducts);

    // Tạo đơn hàng
    const newOrder = new Order({
      userId: user._id,
      name,
      products: processedProducts,
      phone,
      address: {
        province: {
          id: address.province.id,
          name: address.province.name,
        },
        district: {
          id: address.district.id,
          name: address.district.name,
        },
        ward: {
          id: address.ward.id,
          name: address.ward.name,
        },
      },
      addressDetail,
      paymentMethod: "stripe",
      totalAmount,
      note: note || "KHÔNG CÓ",
      status: "pending",
      statusHistory: [
        {
          prevStatus: null,
          status: "pending",
          updatedBy: user._id,
          updatedByModel: "User",
          date: new Date(),
        },
      ],
    });

    // Lưu đơn hàng
    const savedOrder = await newOrder.save();
    console.log("Order saved with ID:", savedOrder._id);

    // Tạo line items cho Stripe
    const lineItems = processedProducts.map((item) => {
      const unitAmount = Math.round(item.price);

      return {
        price_data: {
          currency: "vnd",
          product_data: {
            name: item.name || "Sản phẩm",
            images: item.image ? [item.image] : [],
            metadata: {
              productId: item.pid.toString(),
              orderId: savedOrder._id.toString(),
            },
          },
          unit_amount: unitAmount,
        },
        quantity: item.quantity,
      };
    });

    console.log("Line items created:", lineItems.length);

    // Tạo Stripe session
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      metadata: {
        orderId: savedOrder._id.toString(),
        userId: user._id.toString(),
        totalAmount: totalAmount.toString(),
      },
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.ORDER_RETURN_URL}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.ORDER_RETURN_URL}/checkout?cancelled=true&order_id=${savedOrder._id}`,
      customer_email: user.email,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 phút
    });

    // Lưu stripe session ID vào order
    savedOrder.stripeSessionId = stripeSession.id;
    await savedOrder.save();

    console.log("Stripe session created:", stripeSession.id);
    console.log("Stripe order creation completed successfully");

    return res.status(200).json({
      success: true,
      message: "Tạo phiên thanh toán thành công",
      data: {
        sessionId: stripeSession.id,
        sessionUrl: stripeSession.url,
        orderId: savedOrder._id,
        totalAmount: totalAmount,
        expiresAt: stripeSession.expires_at,
      },
    });
  } catch (error) {
    console.error("Stripe order creation error:", error);

    let errorMessage = "Có lỗi xảy ra khi tạo đơn hàng";

    if (error.type === "StripeCardError") {
      errorMessage = "Lỗi thẻ thanh toán: " + error.message;
    } else if (error.type === "StripeInvalidRequestError") {
      errorMessage = "Thông tin thanh toán không hợp lệ";
    } else if (error.name === "ValidationError") {
      errorMessage = "Thông tin đơn hàng không hợp lệ: " + error.message;
    }

    return res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const validateInventoryAvailability = async (products) => {
  try {
    console.log("Validating inventory availability...");

    for (const item of products) {
      const product = await Product.findById(item.pid);

      if (!product) {
        throw new Error(`Sản phẩm ${item.pid} không tồn tại`);
      }

      if (product.currentStock < item.quantity) {
        throw new Error(
          `Sản phẩm ${product.name} không đủ số lượng (còn ${product.currentStock}, cần ${item.quantity})`
        );
      }
    }

    console.log("Inventory validation completed");
  } catch (error) {
    console.error("Inventory validation error:", error);
    throw error;
  }
};

export const handleWebhookOrder = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.END_POINT_SECRET
    );
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log("Stripe webhook event:", event.type);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutCompleted = event.data.object;
        const orderId = checkoutCompleted.metadata.orderId;

        console.log("Processing successful payment for order:", orderId);

        const order = await Order.findById(orderId);
        if (!order) {
          throw new Error(`Không tìm thấy đơn hàng: ${orderId}`);
        }

        if (order.status !== "pending") {
          console.log(`Order ${orderId} already processed`);
          break;
        }

        // Cập nhật trạng thái đơn hàng
        order.status = "processing";
        order.statusHistory.push({
          prevStatus: "pending",
          status: "processing",
          updatedBy: order.userId,
          updatedByModel: "User",
          date: new Date(),
        });

        await order.save();

        // Trừ kho (không dùng session)
        await updateProductInventory(order.products);

        // Cập nhật promotion
        await updatePromotionAfterOrder(order.products);

        console.log(`Order ${orderId} processed successfully`);
        break;
      }

      case "checkout.session.expired":
      case "payment_intent.payment_failed": {
        const sessionData = event.data.object;
        const orderId = sessionData.metadata.orderId;

        console.log("Processing failed/expired payment for order:", orderId);

        const order = await Order.findById(orderId);
        if (order && order.status === "pending") {
          order.status = "cancelled";
          order.cancelReason =
            event.type === "checkout.session.expired"
              ? "Phiên thanh toán đã hết hạn"
              : "Thanh toán thất bại";
          order.statusHistory.push({
            prevStatus: "pending",
            status: "cancelled",
            updatedBy: order.userId,
            updatedByModel: "User",
            date: new Date(),
          });

          await order.save();
          console.log(`Order ${orderId} cancelled`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const orderStripeReturn = async (req, res) => {
  try {
    const { 
      session_id, 
      order_id, 
      cancelled,
      stripeSessionId,
      orderSessionId
    } = req.query;

    const sessionId = session_id || stripeSessionId;
    const orderId = order_id || (orderSessionId !== 'null' ? orderSessionId : null);

    console.log("🔍 Processing Stripe return:", {
      sessionId,
      orderId,
      cancelled,
      originalQuery: req.query,
      url: req.url
    });

    // Nếu cancelled, trả về thông báo hủy
    if (cancelled === "true") {
      return res.status(200).json({
        success: false,
        message: "Thanh toán đã bị hủy",
        data: { cancelled: true, orderId: orderId },
      });
    }

    let order = null;

    // Tìm order theo stripeSessionId
    if (sessionId) {
      order = await Order.findOne({ stripeSessionId: sessionId }).lean();
    }

    // Tìm order theo _id nếu chưa có
    if (!order && orderId) {
      console.log("🔍 Searching by order_id:", orderId);
      
      // Kiểm tra order_id có phải là valid ObjectId không
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        console.log("❌ Invalid ObjectId:", orderId);
        return res.status(400).json({
          success: false,
          message: "ID đơn hàng không hợp lệ",
        });
      }
      
      order = await Order.findById(orderId).lean();
      console.log("📋 Order found by _id:", order ? "YES" : "NO");
      
      if (order) {
        console.log("📋 Order details:", {
          _id: order._id,
          status: order.status,
          stripeSessionId: order.stripeSessionId,
          userId: order.userId,
          totalAmount: order.totalAmount
        });
      }
    }

    if (order) {
      console.log("✅ Order found, status:", order.status);
      
      // ✅ FIX: Xử lý tất cả trạng thái, bao gồm pending
      if (
        order.status === "processing" ||
        order.status === "shipping" ||
        order.status === "delivered"
      ) {
        return res.status(200).json({
          success: true,
          message: "Thanh toán đơn hàng thành công",
          data: {
            _id: order._id,
            orderId: order._id,
            status: order.status,
            totalAmount: order.totalAmount,
            products: order.products,
            paymentMethod: order.paymentMethod,
            name: order.name,
            phone: order.phone,
            address: order.address,
            addressDetail: order.addressDetail,
            createdAt: order.createdAt,
            note: order.note
          },
        });
      } else if (order.status === "pending") {
        // ✅ FIX: Với Stripe, pending có thể là trạng thái tạm thời
        // Trả về thông tin đơn hàng để hiển thị
        return res.status(200).json({
          success: true,
          message: "Đơn hàng đang xử lý thanh toán",
          data: {
            _id: order._id,
            orderId: order._id,
            status: order.status,
            totalAmount: order.totalAmount,
            products: order.products,
            paymentMethod: order.paymentMethod,
            name: order.name,
            phone: order.phone,
            address: order.address,
            addressDetail: order.addressDetail,
            createdAt: order.createdAt,
            note: order.note,
            message: "Thanh toán đang được xử lý, đơn hàng sẽ được cập nhật trong giây lát"
          },
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Thanh toán thất bại hoặc đã bị hủy",
          data: {
            _id: order._id,
            orderId: order._id,
            status: order.status,
            cancelReason: order.cancelReason,
          },
        });
      }
    }

    // Không tìm thấy order
    console.log("❌ No order found with provided parameters");
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy thông tin đơn hàng",
      debug: {
        sessionId_provided: !!sessionId,
        orderId_provided: !!orderId,
        sessionId_length: sessionId?.length,
        orderId_valid: orderId ? mongoose.Types.ObjectId.isValid(orderId) : false
      }
    });
  } catch (error) {
    console.error("❌ Lỗi xử lý đơn hàng Stripe return:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi xử lý thông tin đặt hàng",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Cập nhật trạng thái đơn hàng
export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const updatedOrder = await Order.findByIdAndUpdate(id, data, { new: true });

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: "Đơn hàng không tồn tại",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cập nhật đơn hàng thành công",
      data: updatedOrder,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi cập nhật trạng thái đơn hàng",
      error: error.message,
    });
  }
};
// GET /api/orders
export const getOrderByAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const { status, paymentMethod, fromDate, toDate, search } = req.query;
    const skip = (page - 1) * pageSize;
    let filter = {};

    if (status) {
      filter.status = status;
    }

    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }

    if (fromDate && toDate) {
      filter.createdAt = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { "userId.email": { $regex: search, $options: "i" } },
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(pageSize))
        .populate("userId", "name email"),
      Order.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        page,
        totalPage: Math.ceil(total / pageSize),
        pageSize,
        totalItems: total,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
// PUT /api/orders/:id
export const updateStatusOrderByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, cancelReason } = req.body;
    const admin = req.admin;

    const order = await Order.findById(id).populate("userId", "name email");
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    // Store the current status before any changes
    const prevStatus = order.status;

    if (order.status === "delivered" || order.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message:
          "Không thể thay đổi trạng thái đơn hàng đã hoàn thành hoặc đã hủy",
      });
    }

    const validTransitions = {
      pending: ["processing", "cancelled"],
      processing: ["shipping", "cancelled"],
      shipping: ["delivered", "cancelled"],
    };

    if (
      status !== "cancelled" &&
      !validTransitions[order.status]?.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: `Không thể chuyển trạng thái từ ${order.status} sang ${status}`,
      });
    }

    switch (status) {
      case "delivered":
        // Khi giao hàng thành công, cập nhật isCompleted = true trong ProductSalesHistory
        await ProductSalesHistory.updateMany(
          { orderId: id },
          { isCompleted: true }
        );
        break;

      case "cancelled":
        if (!cancelReason?.trim()) {
          return res.status(400).json({
            success: false,
            message: "Vui lòng cung cấp lý do hủy đơn hàng",
          });
        }

        // Xử lý hoàn trả khi hủy đơn hàng
        if (["pending", "processing"].includes(order.status)) {
          // Đơn hàng chưa tạo sales history, chỉ hoàn trả currentStock của Product
          const restoreResult = await restoreProductQuantity(order.products);
          if (!restoreResult.success) {
            return res.status(400).json({
              success: false,
              message: "Không thể hoàn lại số lượng sản phẩm",
            });
          }
        } else if (["shipping", "delivered"].includes(order.status)) {
          // Đơn hàng đã tạo sales history, cần hoàn trả vào inventory batch
          const salesHistories = await ProductSalesHistory.find({
            orderId: id,
          });

          for (const salesHistory of salesHistories) {
            // Hoàn trả số lượng vào từng batch theo costDetails
            for (const costDetail of salesHistory.costDetails) {
              try {
                // Tìm batch và cộng lại số lượng
                const batch = await inventoryBatchService.getBatchByNumber(
                  costDetail.batchNumber
                );
                if (batch) {
                  // Chỉ cập nhật remainingQuantity, cộng lại số lượng đã bán
                  await inventoryBatchService.updateBatch(
                    costDetail.batchNumber,
                    undefined, // Không thay đổi total quantity
                    undefined, // Không thay đổi expiry date
                    batch.remainingQuantity + costDetail.quantityTaken // Cộng lại remaining quantity
                  );
                }
              } catch (error) {
                console.error(
                  `Lỗi khi hoàn trả batch ${costDetail.batchNumber}:`,
                  error
                );
              }
            }

            // Cập nhật isCompleted = false
            salesHistory.isCompleted = false;
            await salesHistory.save();
          }
        }

        order.cancelReason = cancelReason.trim();
        break;
    }

    order.status = status;
    order.statusHistory.push({
      prevStatus,
      status,
      updatedBy: admin._id,
      updatedByModel: "Admin",
      date: new Date(),
    });

    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate("userId", "name email")
      .populate({
        path: "statusHistory.updatedBy",
        select: "name username",
        model: mongoose.model("Admin"),
      });

    return res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái đơn hàng thành công",
      data: populatedOrder,
    });
  } catch (error) {
    console.error("Update order status error:", error);
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi cập nhật trạng thái đơn hàng",
      error: error.message,
    });
  }
};

export const removeOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedOrder = await Order.findByIdAndDelete(id);

    if (!deletedOrder) {
      return res.status(404).json({
        success: false,
        message: "Đơn hàng không tồn tại",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Xóa đơn hàng thành công",
      data: deletedOrder,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Có lỗi khi xóa đơn hàng",
      error: error.message,
    });
  }
};

export const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).populate("userId", "name email");
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Đơn hàng không tồn tại",
      });
    }
    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const getOrderByUser = async (req, res) => {
  try {
    const user = req.user;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const { status } = req.query;
    const skip = (page - 1) * pageSize;

    let statusCondition;
    switch (status) {
      case "pending":
        statusCondition = "pending";
        break;
      case "processing":
        statusCondition = "processing";
        break;
      case "shipping":
        statusCondition = "shipping";
        break;
      case "delivered":
        statusCondition = "delivered";
        break;
      case "cancelled":
        statusCondition = "cancelled";
        break;
      default:
        statusCondition = {
          $in: ["pending", "processing", "shipping", "delivered", "cancelled"],
        };
    }

    const [orders, total, counts] = await Promise.all([
      Order.find({ userId: user._id, status: statusCondition })
        .populate({
          path: "statusHistory.updatedBy",
          select: "name",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(pageSize)),
      Order.countDocuments({ userId: user._id, status: statusCondition }),
      Order.aggregate([
        { $match: { userId: user._id } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const statusCounts = {
      pending: 0,
      processing: 0,
      shipping: 0,
      delivered: 0,
      cancelled: 0,
    };

    counts.forEach((item) => {
      statusCounts[item._id] = item.count;
    });

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        page: Number(page),
        totalPage: Math.ceil(total / pageSize),
        totalItems: total,
        pageSize,
      },
      statusCounts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
      data: [],
    });
  }
};

export const updateOrderByUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const { name, province, district, ward, phone, addressDetail } = req.body;
    const order = await Order.findOne({
      _id: id,
      userId: user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Đơn hàng không tồn tại",
      });
    }

    Object.assign(order, {
      ...(name && { name }),
      ...(province?.id && { province }),
      ...(district?.id && { district }),
      ...(ward?.id && { ward }),
      ...(phone && { phone }),
      ...(addressDetail && { addressDetail }),
    });

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Cập nhật đơn hàng thành công",
      data: order,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi cập nhật đơn hàng",
      error: error.message,
    });
  }
};

export const updateStatusOrderByUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, cancelReason } = req.body;
    const user = req.user;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Đơn hàng không tồn tại",
      });
    }

    const allowedActions = {
      cancelled: ["pending", "processing"],
      pending: ["cancelled"],
      delivered: ["shipping"],
    };

    if (!allowedActions[status]?.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: "Không thể thực hiện thao tác này",
      });
    }

    // Store the current status before any changes
    const currentStatus = order.status;

    if (status === "cancelled") {
      if (order.paymentMethod !== "cod") {
        return res.status(400).json({
          success: false,
          message: "Đơn hàng đã thanh toán không thể hủy",
        });
      }

      if (!cancelReason?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp lý do hủy đơn hàng",
        });
      }

      const restoreResult = await restoreProductQuantity(order.products);
      if (!restoreResult.success) {
        return res.status(400).json({
          success: false,
          message: "Không thể hoàn lại số lượng sản phẩm",
        });
      }

      order.cancelReason = cancelReason.trim();
      order.status = "cancelled";
      order.statusHistory.push({
        prevStatus: currentStatus,
        status: "cancelled",
        updatedBy: user._id,
        updatedByModel: "User",
        date: new Date(),
      });
    } else if (status === "pending") {
      order.cancelReason = "";
      order.status = "pending";
      order.statusHistory.push({
        prevStatus: currentStatus,
        status: "pending",
        updatedBy: user._id,
        updatedByModel: "User",
        date: new Date(),
      });
    } else if (status === "delivered") {
      // Khi user xác nhận đã nhận hàng, cập nhật isCompleted = true trong ProductSalesHistory
      await ProductSalesHistory.updateMany(
        { orderId: id },
        { isCompleted: true }
      );
      
      order.status = "delivered";
      order.statusHistory.push({
        prevStatus: currentStatus,
        status: "delivered",
        updatedBy: user._id,
        updatedByModel: "User",
        date: new Date(),
      });
    }

    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate("userId", "name email")
      .populate({
        path: "statusHistory.updatedBy",
        select: "name email",
        model: mongoose.model("User"),
      });

    let message = "";
    switch (status) {
      case "cancelled":
        message = "Hủy đơn hàng thành công";
        break;
      case "pending":
        message = "Đặt lại đơn hàng thành công";
        break;
      case "delivered":
        message = "Xác nhận đã nhận hàng thành công";
        break;
      default:
        message = "Cập nhật trạng thái đơn hàng thành công";
    }

    return res.status(200).json({
      success: true,
      message,
      data: populatedOrder,
    });
  } catch (error) {
    console.error("Update order error:", error);
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi cập nhật đơn hàng",
      error: error.message,
    });
  }
};

export const getOrderDetailByUser = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const order = await Order.findOne({
      _id: id,
      userId: user._id,
    }).populate({
      path: "statusHistory.updatedBy",
      select: "name",
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Không tìm thấy đơn hàng",
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.log("Error get order detail", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
