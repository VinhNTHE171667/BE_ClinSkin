import InventoryBatchService from "../services/inventoryBatch.service.js";
import ProductSalesHistoryService from "../services/ProductSalesHistory.service.js";
import OrderService from "../services/order.service.js";

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

// lấy thống trong tháng cụ thể trong năm
export const getMonthlyStatistic = async (req, res) => {
    try {
        const { year, month } = req.query;
        
        // Kiểm tra tham số đầu vào
        if (!year || !month) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng cung cấp tham số year và month"
            });
        }

        const yearNum = parseInt(year);
        const monthNum = parseInt(month);

        if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
            return res.status(400).json({
                success: false,
                message: "Tham số year và month không hợp lệ"
            });
        }

        const revenueStats = await ProductSalesHistoryService.getMonthlyRevenue(yearNum, monthNum);
        const orderStats = await OrderService.getMonthlyOrderStats(yearNum, monthNum);

        const combinedStats = {
            year: yearNum,
            month: monthNum,
            revenue: {
                totalRevenue: revenueStats.totalRevenue || 0,
                totalCost: revenueStats.totalCost || 0,
                grossProfit: revenueStats.grossProfit || 0,
                completedOrders: revenueStats.totalOrders || 0
            },
            orders: {
                totalOrders: orderStats.totalOrders || 0,
                completedOrders: orderStats.completedOrders || 0,
                totalCompletedAmount: orderStats.totalCompletedAmount || 0,
                totalPendingAmount: orderStats.totalPendingAmount || 0,
                completionRate: orderStats.totalOrders > 0 
                    ? Math.round((orderStats.completedOrders / orderStats.totalOrders) * 100) 
                    : 0
            }
        };

        return res.status(200).json({
            success: true,
            data: combinedStats
        });
    } catch (error) {
        console.error('Error fetching monthly statistics:', error);
        return res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra khi lấy thống kê tháng",
            error: error.message
        });
    }
}