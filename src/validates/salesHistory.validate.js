import { body } from "express-validator";

export const createSalesHistoryValidation = [
  body("orderId")
    .notEmpty()
    .withMessage("Order ID không được để trống")
    .isMongoId()
    .withMessage("Order ID phải là một ObjectId hợp lệ"),
  
  body("orderData")
    .notEmpty()
    .withMessage("Thông tin đơn hàng là bắt buộc")
    .isObject()
    .withMessage("Thông tin đơn hàng phải là object"),
  
  body("orderData.id")
    .notEmpty()
    .withMessage("ID đơn hàng là bắt buộc"),
  
  body("orderData.user")
    .notEmpty()
    .withMessage("Thông tin user là bắt buộc")
    .isObject()
    .withMessage("Thông tin user phải là object"),
  
  body("orderData.totalAmount")
    .notEmpty()
    .withMessage("Tổng tiền đơn hàng là bắt buộc")
    .isNumeric()
    .withMessage("Tổng tiền phải là số"),
  
  body("orderData.status")
    .notEmpty()
    .withMessage("Trạng thái đơn hàng là bắt buộc"),
  
  body("availableItems")
    .notEmpty()
    .withMessage("Danh sách sản phẩm là bắt buộc")
    .isArray({ min: 1 })
    .withMessage("Phải có ít nhất 1 sản phẩm"),
  
  body("availableItems.*.product")
    .notEmpty()
    .withMessage("Thông tin sản phẩm là bắt buộc")
    .isObject()
    .withMessage("Thông tin sản phẩm phải là object"),
  
  body("availableItems.*.product._id")
    .notEmpty()
    .withMessage("ID sản phẩm là bắt buộc")
    .isMongoId()
    .withMessage("ID sản phẩm phải là ObjectId hợp lệ"),
  
  body("availableItems.*.product.name")
    .notEmpty()
    .withMessage("Tên sản phẩm là bắt buộc"),
  
  body("availableItems.*.totalQuantity")
    .notEmpty()
    .withMessage("Số lượng sản phẩm là bắt buộc")
    .isInt({ min: 1 })
    .withMessage("Số lượng phải là số nguyên lớn hơn 0"),
  
  body("availableItems.*.price")
    .notEmpty()
    .withMessage("Giá sản phẩm là bắt buộc")
    .isNumeric()
    .withMessage("Giá phải là số")
    .custom((value) => {
      if (value < 0) {
        throw new Error("Giá phải lớn hơn hoặc bằng 0");
      }
      return true;
    }),
  
  body("availableItems.*.batchItems")
    .notEmpty()
    .withMessage("Thông tin batch là bắt buộc")
    .isObject()
    .withMessage("Thông tin batch phải là object"),
  
  body("availableItems.*.batchItems.items")
    .notEmpty()
    .withMessage("Danh sách batch items là bắt buộc")
    .isArray({ min: 1 })
    .withMessage("Phải có ít nhất 1 batch item"),
  
  body("availableItems.*.batchItems.items.*.batchNumber")
    .notEmpty()
    .withMessage("Số batch là bắt buộc"),
  
  body("availableItems.*.batchItems.items.*.remainingQuantity")
    .notEmpty()
    .withMessage("Số lượng còn lại là bắt buộc")
    .isInt({ min: 0 })
    .withMessage("Số lượng còn lại phải là số nguyên >= 0"),
  
  body("availableItems.*.batchItems.items.*.costPrice")
    .notEmpty()
    .withMessage("Giá vốn là bắt buộc")
    .isNumeric()
    .withMessage("Giá vốn phải là số")
    .custom((value) => {
      if (value < 0) {
        throw new Error("Giá vốn phải lớn hơn hoặc bằng 0");
      }
      return true;
    }),
];
