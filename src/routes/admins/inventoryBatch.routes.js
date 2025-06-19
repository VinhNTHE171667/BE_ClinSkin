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
import { getBatchItemsByOrderId } from '../../controllers/productSalesHistory.controller.js';

const router = Router();

router.post('/', createBatchValidationRules, validate, inventoryBatchController.createBatch);
router.get('/', inventoryBatchController.getAllBatches);
router.get('/:batchNumber', getBatchByNumberValidationRules, validate, inventoryBatchController.getBatchByNumber);
router.get('/product/:productId', getBatchesByProductIdValidationRules, validate, inventoryBatchController.getBatchesByProductId);
router.put('/:batchNumber', updateBatchValidationRules, validate, inventoryBatchController.updateBatch);
router.delete('/:batchNumber', deleteBatchValidationRules, validate, inventoryBatchController.deleteBatch);
router.get("/order/:orderId", getBatchItemsByOrderId);
export default router;
