import { body, param, query } from "express-validator";

export const createProductValidate = [
  body("name")
    .notEmpty()
    .withMessage("Tên sản phẩm không được để trống")
    .isLength({ min: 2 })
    .withMessage("Tên sản phẩm phải có ít nhất 2 ký tự"),
  body("price")
    .notEmpty()
    .withMessage("Giá sản phẩm không được để trống")
    .isNumeric()
    .withMessage("Giá sản phẩm phải là số")
    .custom(value => {
      if (parseFloat(value) < 0) throw new Error("Giá sản phẩm không được âm");
      return true;
    }),
  body("currentStock")
    .optional()
    .isNumeric()
    .withMessage("Số lượng phải là số")
    .custom(value => {
      if (parseInt(value) < 0) throw new Error("Số lượng không được âm");
      return true;
    }),
  body("brandId")
    .notEmpty()
    .withMessage("Thương hiệu không được để trống"),
  body("categories")
    .optional()
    .isArray()
    .withMessage("Danh mục phải là một mảng"),
  body("mainImageBase64")
    .notEmpty()
    .withMessage("Hình ảnh chính không được để trống"),
  body("additionalImagesBase64")
    .optional()
    .isArray()
    .withMessage("Hình ảnh phụ phải là một mảng"),
  body("description")
    .optional(),
  body("tags")
    .optional()
    .isArray()
    .withMessage("Tags phải là một mảng"),
];

export const updateProductValidate = [
  param("id")
    .isMongoId()
    .withMessage("ID sản phẩm không hợp lệ"),
  body("name")
    .optional()
    .isLength({ min: 2 })
    .withMessage("Tên sản phẩm phải có ít nhất 2 ký tự"),
  body("price")
    .optional()
    .isNumeric()
    .withMessage("Giá sản phẩm phải là số")
    .custom(value => {
      if (parseFloat(value) < 0) throw new Error("Giá sản phẩm không được âm");
      return true;
    }),
  body("currentStock")
    .optional()
    .isNumeric()
    .withMessage("Số lượng phải là số")
    .custom(value => {
      if (parseInt(value) < 0) throw new Error("Số lượng không được âm");
      return true;
    }),
  body("brandId")
    .optional(),
  body("categories")
    .optional()
    .isArray()
    .withMessage("Danh mục phải là một mảng"),
  body("mainImageBase64")
    .optional(),
  body("removeImageIds")
    .optional()
    .isArray()
    .withMessage("ID hình ảnh cần xóa phải là một mảng"),
];

export const deleteProductValidate = [
  param("id")
    .isMongoId()
    .withMessage("ID sản phẩm không hợp lệ"),
];

export const getProductByIdValidate = [
  param("id")
    .isMongoId()
    .withMessage("ID sản phẩm không hợp lệ"),
];

export const getProductsValidate = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Trang phải là số nguyên dương"),
  query("pageSize")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Số lượng trên trang phải là số nguyên dương"),
  query("minPrice")
    .optional()
    .isNumeric()
    .withMessage("Giá tối thiểu phải là số"),
  query("maxPrice")
    .optional()
    .isNumeric()
    .withMessage("Giá tối đa phải là số"),
  query("includeDeleted")
    .optional()
    .isBoolean()
    .withMessage("Tham số includeDeleted phải là boolean"),
];
