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

// Search products by name
router.get('/search', getProductsValidate, validateMiddleWare, searchProductByName);

// Get paginated products with filters
router.get('/', getProductsValidate, validateMiddleWare, getProducts);

// Get single product by ID
router.get('/:id', getProductByIdValidate, validateMiddleWare, getProductById);

// Create new product
router.post('/', createProductValidate, validateMiddleWare, createProduct);

// Update product
router.put('/:id', updateProductValidate, validateMiddleWare, updateProduct);

// Soft delete product
router.delete('/:id', deleteProductValidate, validateMiddleWare, deleteProduct);

// Restore deleted product
router.post('/:id/restore', deleteProductValidate, validateMiddleWare, restoreProduct);

export default router;