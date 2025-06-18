import { body, param, query } from 'express-validator';

export const createBatchValidationRules = [
  body('productId')
    .notEmpty().withMessage('ID sản phẩm là bắt buộc')
    .isMongoId().withMessage('ID sản phẩm không hợp lệ'),

  body('importer')
    .notEmpty().withMessage('ID người nhập là bắt buộc')
    .isMongoId().withMessage('ID người nhập không hợp lệ'),

  body('quantity')
    .notEmpty().withMessage('Số lượng là bắt buộc')
    .isInt({ min: 1 }).withMessage('Số lượng phải là số nguyên dương'),

  body('costPrice')
    .notEmpty().withMessage('Giá nhập là bắt buộc')
    .isFloat({ min: 0 }).withMessage('Giá nhập phải là số dương'),

  body('expiryDate')
    .notEmpty().withMessage('Ngày hết hạn là bắt buộc')
    .isISO8601().withMessage('Ngày hết hạn phải đúng định dạng')
    .custom(value => {
      if (new Date(value) <= new Date()) {
        throw new Error('Ngày hết hạn phải sau ngày hiện tại');
      }
      return true;
    }),

  body('receivedDate')
    .optional()
    .isISO8601().withMessage('Ngày nhận phải đúng định dạng'),
];

export const updateBatchValidationRules = [
  param('batchNumber')
    .notEmpty().withMessage('Mã lô là bắt buộc')
    .isString().withMessage('Mã lô phải là chuỗi'),
  body('newQuantity')
    .notEmpty().withMessage('Số lượng mới là bắt buộc')
    .isInt({ min: 0 }).withMessage('Số lượng mới phải là số nguyên không âm'),
  body('expiryDate')
    .optional()
    .isISO8601().withMessage('Ngày hết hạn phải đúng định dạng')
];

export const getBatchByNumberValidationRules = [
  param('batchNumber')
    .notEmpty().withMessage('Mã lô là bắt buộc')
    .isString().withMessage('Mã lô phải là chuỗi')
];

export const getBatchesByProductIdValidationRules = [
  param('productId')
    .notEmpty().withMessage('ID sản phẩm là bắt buộc')
    .isMongoId().withMessage('ID sản phẩm không hợp lệ')
];

export const deleteBatchValidationRules = [
  param('batchNumber')
    .notEmpty().withMessage('Mã lô là bắt buộc')
    .isString().withMessage('Mã lô phải là chuỗi')
];
