import express from "express";
import { 
  searchProductByName, 
  getProducts, 
  getProductById, 
  createProduct,
  updateProduct,
  deleteProduct,
  restoreProduct
} from "../../controllers/productController.js";
import {
  createProductValidate,
  updateProductValidate,
  deleteProductValidate,
  getProductByIdValidate,
  getProductsValidate
} from "../../validates/product.validate.js";
import { validateMiddleWare } from "../../middleware/validate.middleware.js";

const router = express.Router();

router.get('/search', getProductsValidate, validateMiddleWare, searchProductByName);
router.get('/', getProductsValidate, validateMiddleWare, getProducts);
router.get('/:id', getProductByIdValidate, validateMiddleWare, getProductById);
router.post('/', createProductValidate, validateMiddleWare, createProduct);
router.put('/:id', updateProductValidate, validateMiddleWare, updateProduct);
router.delete('/:id', deleteProductValidate, validateMiddleWare, deleteProduct);
router.post('/:id/restore', deleteProductValidate, validateMiddleWare, restoreProduct);

export default router;