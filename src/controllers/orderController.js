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
// Cập nhật số lượng sản phẩm
const updatePromotionAfterOrder = async (products) => {
  console.log("Cập nhật thông tin khuyến mãi sau khi đặt hàng");
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
          const salesHistories = await ProductSalesHistory.find({ orderId: id });
          
          for (const salesHistory of salesHistories) {
            // Hoàn trả số lượng vào từng batch theo costDetails
            for (const costDetail of salesHistory.costDetails) {
              try {
                // Tìm batch và cộng lại số lượng
                const batch = await inventoryBatchService.getBatchByNumber(costDetail.batchNumber);
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
                console.error(`Lỗi khi hoàn trả batch ${costDetail.batchNumber}:`, error);
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
