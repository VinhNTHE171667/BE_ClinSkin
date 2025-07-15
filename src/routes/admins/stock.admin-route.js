import express from 'express';
import { updateAllProductsStock } from '../../services/stockUpdate.service.js';
import { StatusCodes } from 'http-status-codes';

const router = express.Router();

/**
 * POST /api/v1/admin/stock/update-all
 */
router.post('/update-all', async (req, res) => {
  try {
    await updateAllProductsStock();
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Đã cập nhật currentStock cho tất cả sản phẩm thành công'
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật stock:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Lỗi server khi cập nhật stock',
      error: error.message
    });
  }
});

export default router;
