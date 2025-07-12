import InventoryBatchService from "../services/inventoryBatch.service.js";
import ProductSalesHistoryService from "../services/ProductSalesHistory.service.js";
import OrderService from "../services/order.service.js";
import UserService from "../services/user.service.js";
import ReviewService from "../services/review.service.js";

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
// Lấy thống kê tổng quan về kho, người dùng và đánh giá
export const getOverallStatistics = async (req, res) => {
    try {
        const { daysUntilExpiry } = req.query;
        const daysParam = parseInt(daysUntilExpiry) || 30;

        const [batchStats, userStats, reviewStats] = await Promise.all([
            InventoryBatchService.getBatchStatistics(daysParam),
            UserService.getUserStatistics(),
            ReviewService.getReviewStatistics()
        ]);

        const combinedStats = {
            inventory: {
                totalBatches: batchStats.totalInventory.totalBatches,
                totalQuantity: batchStats.totalInventory.totalQuantity,
                totalValue: batchStats.totalInventory.totalValue,
                nearExpiry: {
                    daysUntilExpiry: batchStats.nearExpiry.daysUntilExpiry,
                    totalBatches: batchStats.nearExpiry.totalBatches,
                    totalQuantity: batchStats.nearExpiry.totalQuantity,
                    totalValue: batchStats.nearExpiry.totalValue
                },
                expired: {
                    totalBatches: batchStats.expired.totalBatches,
                    totalQuantity: batchStats.expired.totalQuantity,
                    totalValue: batchStats.expired.totalValue
                }
            },
            users: {
                totalUsers: userStats.totalUsers,
                newUsersLast30Days: userStats.newUsersLast30Days
            },
            reviews: {
                totalReviews: reviewStats.totalReviews,
                averageRating: reviewStats.averageRating
            }
        };

        return res.status(200).json({
            success: true,
            data: combinedStats
        });

    } catch (error) {
        console.error('Error fetching overall statistics:', error);
        return res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra khi lấy thống kê tổng quan",
            error: error.message
        });
    }
}

// Lấy doanh thu theo ngày trong tháng
export const getDailyRevenueInMonth = async (req, res) => {
    try {
        const { year, month } = req.params;
        
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);
        
        if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
            return res.status(400).json({
                success: false,
                message: "Năm và tháng không hợp lệ"
            });
        }

        const result = await ProductSalesHistoryService.getDailyRevenueInMonth(yearNum, monthNum);
        
        return res.status(200).json({
            success: true,
            message: "Lấy doanh thu theo ngày thành công",
            data: result
        });
    } catch (error) {
        console.error("Lỗi khi lấy doanh thu theo ngày:", error);
        return res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra khi lấy doanh thu theo ngày",
            error: error.message
        });
    }
};

// Lấy doanh thu theo tháng trong năm
export const getMonthlyRevenueInYear = async (req, res) => {
    try {
        const { year } = req.params;
        
        const yearNum = parseInt(year);
        
        if (isNaN(yearNum)) {
            return res.status(400).json({
                success: false,
                message: "Năm không hợp lệ"
            });
        }

        const result = await ProductSalesHistoryService.getMonthlyRevenueInYear(yearNum);
        
        return res.status(200).json({
            success: true,
            message: "Lấy doanh thu theo tháng thành công",
            data: result
        });
    } catch (error) {
        console.error("Lỗi khi lấy doanh thu theo tháng:", error);
        return res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra khi lấy doanh thu theo tháng",
            error: error.message
        });
    }
};

// Lấy doanh thu 5 năm gần nhất
export const getYearlyRevenueLastFiveYears = async (req, res) => {
    try {
        const result = await ProductSalesHistoryService.getYearlyRevenueLastFiveYears();
        
        return res.status(200).json({
            success: true,
            message: "Lấy doanh thu 5 năm gần nhất thành công",
            data: result
        });
    } catch (error) {
        console.error("Lỗi khi lấy doanh thu 5 năm gần nhất:", error);
        return res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra khi lấy doanh thu 5 năm gần nhất",
            error: error.message
        });
    }
};

// Lấy thống kê đơn hàng theo ngày trong tháng
export const getDailyOrderStatsInMonth = async (req, res) => {
    try {
        const { year, month } = req.params;
        
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);
        
        if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
            return res.status(400).json({
                success: false,
                message: "Năm và tháng không hợp lệ"
            });
        }

        const result = await OrderService.getDailyOrderStatsInMonth(yearNum, monthNum);
        
        return res.status(200).json({
            success: true,
            message: "Lấy thống kê đơn hàng theo ngày thành công",
            data: result
        });
    } catch (error) {
        console.error("Lỗi khi lấy thống kê đơn hàng theo ngày:", error);
        return res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra khi lấy thống kê đơn hàng theo ngày",
            error: error.message
        });
    }
};

// Lấy thống kê đơn hàng theo tháng trong năm
export const getMonthlyOrderStatsInYear = async (req, res) => {
    try {
        const { year } = req.params;
        
        const yearNum = parseInt(year);
        
        if (isNaN(yearNum)) {
            return res.status(400).json({
                success: false,
                message: "Năm không hợp lệ"
            });
        }

        const result = await OrderService.getMonthlyOrderStatsInYear(yearNum);
        
        return res.status(200).json({
            success: true,
            message: "Lấy thống kê đơn hàng theo tháng thành công",
            data: result
        });
    } catch (error) {
        console.error("Lỗi khi lấy thống kê đơn hàng theo tháng:", error);
        return res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra khi lấy thống kê đơn hàng theo tháng",
            error: error.message
        });
    }
};

// Lấy thống kê đơn hàng 5 năm gần nhất
export const getYearlyOrderStatsLastFiveYears = async (req, res) => {
    try {
        const result = await OrderService.getYearlyOrderStatsLastFiveYears();
        
        return res.status(200).json({
            success: true,
            message: "Lấy thống kê đơn hàng 5 năm gần nhất thành công",
            data: result
        });
    } catch (error) {
        console.error("Lỗi khi lấy thống kê đơn hàng 5 năm gần nhất:", error);
        return res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra khi lấy thống kê đơn hàng 5 năm gần nhất",
            error: error.message
        });
    }
};

// Lấy thống kê đánh giá theo ngày trong tháng
export const getDailyReviewStatsInMonth = async (req, res) => {
    try {
        const { year, month } = req.params;
        
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);
        
        if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
            return res.status(400).json({
                success: false,
                message: "Năm và tháng không hợp lệ"
            });
        }

        const result = await ReviewService.getDailyReviewStatsInMonth(yearNum, monthNum);
        
        return res.status(200).json({
            success: true,
            message: "Lấy thống kê đánh giá theo ngày thành công",
            data: result
        });
    } catch (error) {
        console.error("Lỗi khi lấy thống kê đánh giá theo ngày:", error);
        return res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra khi lấy thống kê đánh giá theo ngày",
            error: error.message
        });
    }
};

// Lấy thống kê đánh giá theo tháng trong năm
export const getMonthlyReviewStatsInYear = async (req, res) => {
    try {
        const { year } = req.params;
        
        const yearNum = parseInt(year);
        
        if (isNaN(yearNum)) {
            return res.status(400).json({
                success: false,
                message: "Năm không hợp lệ"
            });
        }

        const result = await ReviewService.getMonthlyReviewStatsInYear(yearNum);
        
        return res.status(200).json({
            success: true,
            message: "Lấy thống kê đánh giá theo tháng thành công",
            data: result
        });
    } catch (error) {
        console.error("Lỗi khi lấy thống kê đánh giá theo tháng:", error);
        return res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra khi lấy thống kê đánh giá theo tháng",
            error: error.message
        });
    }
};

// Lấy thống kê đánh giá 5 năm gần nhất
export const getYearlyReviewStatsLastFiveYears = async (req, res) => {
    try {
        const result = await ReviewService.getYearlyReviewStatsLastFiveYears();
        
        return res.status(200).json({
            success: true,
            message: "Lấy thống kê đánh giá 5 năm gần nhất thành công",
            data: result
        });
    } catch (error) {
        console.error("Lỗi khi lấy thống kê đánh giá 5 năm gần nhất:", error);
        return res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra khi lấy thống kê đánh giá 5 năm gần nhất",
            error: error.message
        });
    }
};

// Lấy danh sách sản phẩm bán chạy nhất theo tháng
export const getBestSellingProductsByMonth = async (req, res) => {
    try {
        const { year, month } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const yearNum = parseInt(year);
        const monthNum = parseInt(month);
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
            return res.status(400).json({
                success: false,
                message: "Năm và tháng không hợp lệ"
            });
        }

        if (isNaN(pageNum) || pageNum < 1) {
            return res.status(400).json({
                success: false,
                message: "Số trang không hợp lệ"
            });
        }

        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return res.status(400).json({
                success: false,
                message: "Số lượng sản phẩm mỗi trang phải từ 1-100"
            });
        }

        const result = await ProductSalesHistoryService.getBestSellingProductsByMonth(
            yearNum, 
            monthNum, 
            pageNum, 
            limitNum
        );

        return res.status(200).json({
            success: true,
            message: "Lấy danh sách sản phẩm bán chạy nhất thành công",
            data: result.products,
            pagination: result.pagination,
            summary: result.summary
        });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách sản phẩm bán chạy nhất:", error);
        return res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra khi lấy danh sách sản phẩm bán chạy nhất",
            error: error.message
        });
    }
};

// Lấy danh sách sản phẩm bán chạy nhất theo năm
export const getBestSellingProductsByYear = async (req, res) => {
    try {
        const { year } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const yearNum = parseInt(year);
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        if (isNaN(yearNum) || yearNum < 2000 || yearNum > new Date().getFullYear()) {
            return res.status(400).json({
                success: false,
                message: "Năm không hợp lệ"
            });
        }

        if (isNaN(pageNum) || pageNum < 1) {
            return res.status(400).json({
                success: false,
                message: "Số trang không hợp lệ"
            });
        }

        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return res.status(400).json({
                success: false,
                message: "Số lượng sản phẩm mỗi trang phải từ 1-100"
            });
        }

        const result = await ProductSalesHistoryService.getBestSellingProductsByYear(
            yearNum, 
            pageNum, 
            limitNum
        );

        return res.status(200).json({
            success: true,
            message: "Lấy danh sách sản phẩm bán chạy nhất theo năm thành công",
            data: result.products,
            pagination: result.pagination,
            summary: result.summary
        });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách sản phẩm bán chạy nhất theo năm:", error);
        return res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra khi lấy danh sách sản phẩm bán chạy nhất theo năm",
            error: error.message
        });
    }
};

export const getProductLineChartByYear = async (req, res) => {
    try {
        const { productId, year } = req.params;

        const yearNum = parseInt(year);

        if (isNaN(yearNum) || yearNum < 2000 || yearNum > new Date().getFullYear()) {
            return res.status(400).json({
                success: false,
                message: "Năm không hợp lệ"
            });
        }

        const result = await ProductSalesHistoryService.getProductLineChartByYear(
            productId, 
            yearNum
        );

        if (!result.productInfo) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy dữ liệu cho sản phẩm này"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Lấy thống kê lineChart sản phẩm thành công",
            data: result
        });
    } catch (error) {
        console.error("Lỗi khi lấy thống kê lineChart sản phẩm:", error);
        return res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra khi lấy thống kê lineChart sản phẩm",
            error: error.message
        });
    }
};

export const getProductLineChartByLastFiveYears = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng cung cấp productId"
            });
        }

        const result = await ProductSalesHistoryService.getProductLineChartByLastFiveYears(productId);

        if (!result.productInfo) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy dữ liệu cho sản phẩm này"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Lấy thống kê lineChart sản phẩm 5 năm gần nhất thành công",
            data: result
        });
    } catch (error) {
        console.error("Lỗi khi lấy thống kê lineChart sản phẩm 5 năm gần nhất:", error);
        return res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra khi lấy thống kê lineChart sản phẩm 5 năm gần nhất",
            error: error.message
        });
    }
};