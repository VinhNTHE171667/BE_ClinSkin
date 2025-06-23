import InventoryBatchService from "../services/inventoryBatch.service.js";

export const getProductsWithNearExpiryBatches = async (req, res) => {
    try {
        const { days, page, pageSize } = req.query;
        const daysUntilExpiry = parseInt(days) || 30;
        
        const result = await InventoryBatchService.getProductsWithNearExpiryBatches(
            daysUntilExpiry, 
            page, 
            pageSize
        );

        return res.status(200).json({
            success: true,
            data: result.products,
            pagination: result.pagination,
            summary: result.summary
        });

    } catch (error) {
        console.error('Error fetching products with near expiry batches:', error);
        return res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra khi lấy danh sách sản phẩm sắp hết hạn",
            error: error.message
        });
    }
}