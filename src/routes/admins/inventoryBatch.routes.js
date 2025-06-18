import { Router } from 'express';
import * as inventoryBatchController from '../../controllers/inventoryBatch.controller.js';
import { 
  createBatchValidationRules,
  updateBatchValidationRules,
  getBatchByNumberValidationRules,
  getBatchesByProductIdValidationRules,
  deleteBatchValidationRules
} from '../../validates/inventoryBatchValidator.js';
import { validateMiddleWare as validate } from '../../middleware/validate.middleware.js';

const router = Router();

// Create a new batch
router.post('/', createBatchValidationRules, validate, inventoryBatchController.createBatch);

// Get all batches with filtering and pagination
router.get('/', inventoryBatchController.getAllBatches);

// Get batch by batch number
router.get('/:batchNumber', getBatchByNumberValidationRules, validate, inventoryBatchController.getBatchByNumber);

// Get batches by product ID
router.get('/product/:productId', getBatchesByProductIdValidationRules, validate, inventoryBatchController.getBatchesByProductId);

// Update batch quantity
router.put('/:batchNumber', updateBatchValidationRules, validate, inventoryBatchController.updateBatch);

// Delete batch
router.delete('/:batchNumber', deleteBatchValidationRules, validate, inventoryBatchController.deleteBatch);

export default router;
