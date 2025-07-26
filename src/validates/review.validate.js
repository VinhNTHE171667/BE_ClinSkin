import { body } from "express-validator";

export const createReviewValidate = [
  body("rate")
    .notEmpty()
    .withMessage("Vui lòng chọn mức độ hài lòng của bạn")
    .isInt({ min: 1, max: 5 })
    .withMessage("Đánh giá sao phải từ 1 đến 5"),
  body("comment").notEmpty().withMessage("Vui lòng nhập nội dung đánh giá"),
];

export const createReviewWithOrderValidate = [
  body("productId")
    .notEmpty()
    .withMessage("Vui lòng cung cấp ID sản phẩm")
    .isMongoId()
    .withMessage("ID sản phẩm không hợp lệ"),
  body("rate")
    .notEmpty()
    .withMessage("Vui lòng chọn mức độ hài lòng của bạn")
    .isInt({ min: 1, max: 5 })
    .withMessage("Đánh giá sao phải từ 1 đến 5"),
  body("comment")
    .notEmpty()
    .withMessage("Vui lòng nhập nội dung đánh giá"),
  body("images")
    .optional()
    .isArray()
    .withMessage("Hình ảnh phải là một mảng"),
];
