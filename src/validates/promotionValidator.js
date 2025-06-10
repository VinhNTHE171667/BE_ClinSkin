import { body } from 'express-validator';

export const promotionValidationRules = [
  body('name')
    .notEmpty().withMessage('Tiêu đề là bắt buộc')
    .isLength({ min: 3, max: 100 }).withMessage('Tiêu đề phải từ 3 đến 100 ký tự'),

  body('description')
    .optional()
    .isLength({ max: 1000 }).withMessage('Mô tả tối đa 1000 ký tự'),

  body('startDate')
    .notEmpty().withMessage('Ngày bắt đầu là bắt buộc')
    .isISO8601().withMessage('Ngày bắt đầu không hợp lệ'),

  body('endDate')
    .notEmpty().withMessage('Ngày kết thúc là bắt buộc')
    .isISO8601().withMessage('Ngày kết thúc không hợp lệ')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('Ngày kết thúc phải sau ngày bắt đầu');
      }
      return true;
    }),

  body('isActive')
    .optional()
    .isBoolean().withMessage('Trạng thái phải là true hoặc false'),

      body('products')
    .isArray({ min: 1 }).withMessage('Phải có ít nhất một sản phẩm trong khuyến mãi'),

  body('products.*.pid')
    .notEmpty().withMessage('Mỗi sản phẩm phải có ID')
    .isMongoId().withMessage('ID sản phẩm không hợp lệ'),

  body('products.*.discount')
    .notEmpty().withMessage('Mỗi sản phẩm phải có mức giảm giá')
    .isFloat({ min: 0, max: 100 }).withMessage('Giảm giá mỗi sản phẩm phải từ 0% đến 100%')
];
