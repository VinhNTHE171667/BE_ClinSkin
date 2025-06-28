import ProductSalesHistory from "../models/ProductSalesHistory.model.js";

class ProductSalesHistoryService {
    async getMonthlyRevenue(year, month) {
        try {
            const startDate = new Date(year, month - 1, 1); 
            const endDate = new Date(year, month, 0, 23, 59, 59, 999); 
            
            const result = await ProductSalesHistory.aggregate([
                {
                    $match: {
                        saleDate: {
                            $gte: startDate,
                            $lte: endDate
                        },
                        isCompleted: true
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: "$totalRevenue" },
                        totalCost: { $sum: "$totalCost" },
                        totalOrders: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalRevenue: 1,
                        totalCost: 1,
                        grossProfit: { $subtract: ["$totalRevenue", "$totalCost"] },
                        totalOrders: 1,
                        month: month,
                        year: year
                    }
                }
            ]);

            if (result.length === 0) {
                return {
                    totalRevenue: 0,
                    totalCost: 0,
                    grossProfit: 0,
                    totalOrders: 0,
                    month: month,
                    year: year
                };
            }

            return result[0];
        } catch (error) {
            throw new Error(`Lỗi khi lấy doanh thu tháng ${month}/${year}: ${error.message}`);
        }
    }

    // Thống kê doanh thu và lợi nhuận các ngày trong tháng
    async getDailyRevenueInMonth(year, month) {
        try {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59, 999);

            const result = await ProductSalesHistory.aggregate([
                {
                    $match: {
                        saleDate: {
                            $gte: startDate,
                            $lte: endDate
                        },
                        isCompleted: true
                    }
                },
                {
                    $group: {
                        _id: { $dayOfMonth: "$saleDate" },
                        totalRevenue: { $sum: "$totalRevenue" },
                        totalCost: { $sum: "$totalCost" },
                        totalOrders: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        day: "$_id",
                        totalRevenue: 1,
                        totalCost: 1,
                        grossProfit: { $subtract: ["$totalRevenue", "$totalCost"] },
                        totalOrders: 1,
                        _id: 0
                    }
                },
                {
                    $sort: { day: 1 }
                }
            ]);

            return {
                month: month,
                year: year,
                dailyData: result.map(item => ({
                    day: item.day,
                    totalRevenue: item.totalRevenue,
                    totalCost: item.totalCost,
                    grossProfit: item.grossProfit,
                    totalOrders: item.totalOrders
                }))
            };
        } catch (error) {
            throw new Error(`Lỗi khi lấy doanh thu theo ngày tháng ${month}/${year}: ${error.message}`);
        }
    }

    // Thống kê doanh thu và lợi nhuận các tháng trong năm
    async getMonthlyRevenueInYear(year) {
        try {
            const startDate = new Date(year, 0, 1);
            const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

            const result = await ProductSalesHistory.aggregate([
                {
                    $match: {
                        saleDate: {
                            $gte: startDate,
                            $lte: endDate
                        },
                        isCompleted: true
                    }
                },
                {
                    $group: {
                        _id: { $month: "$saleDate" },
                        totalRevenue: { $sum: "$totalRevenue" },
                        totalCost: { $sum: "$totalCost" },
                        totalOrders: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        month: "$_id",
                        totalRevenue: 1,
                        totalCost: 1,
                        grossProfit: { $subtract: ["$totalRevenue", "$totalCost"] },
                        totalOrders: 1,
                        _id: 0
                    }
                },
                {
                    $sort: { month: 1 }
                }
            ]);

            return {
                year: year,
                monthlyData: result.map(item => ({
                    month: item.month,
                    totalRevenue: item.totalRevenue,
                    totalCost: item.totalCost,
                    grossProfit: item.grossProfit,
                    totalOrders: item.totalOrders
                }))
            };
        } catch (error) {
            throw new Error(`Lỗi khi lấy doanh thu theo tháng năm ${year}: ${error.message}`);
        }
    }

    // Thống kê doanh thu và lợi nhuận 5 năm gần nhất
    async getYearlyRevenueLastFiveYears() {
        try {
            const currentYear = new Date().getFullYear();
            const startYear = currentYear - 4;
            const startDate = new Date(startYear, 0, 1);
            const endDate = new Date(currentYear, 11, 31, 23, 59, 59, 999);

            const result = await ProductSalesHistory.aggregate([
                {
                    $match: {
                        saleDate: {
                            $gte: startDate,
                            $lte: endDate
                        },
                        isCompleted: true
                    }
                },
                {
                    $group: {
                        _id: { $year: "$saleDate" },
                        totalRevenue: { $sum: "$totalRevenue" },
                        totalCost: { $sum: "$totalCost" },
                        totalOrders: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        year: "$_id",
                        totalRevenue: 1,
                        totalCost: 1,
                        grossProfit: { $subtract: ["$totalRevenue", "$totalCost"] },
                        totalOrders: 1,
                        _id: 0
                    }
                },
                {
                    $sort: { year: 1 }
                }
            ]);
            const yearlyData = result.map(item => ({
                year: item.year,
                totalRevenue: item.totalRevenue,
                totalCost: item.totalCost,
                grossProfit: item.grossProfit,
                totalOrders: item.totalOrders
            }));
            return {
                yearRange: `${startYear}-${currentYear}`,
                yearlyData: yearlyData
            };
        } catch (error) {
            throw new Error(`Lỗi khi lấy doanh thu 5 năm gần nhất: ${error.message}`);
        }
    }
}

export default new ProductSalesHistoryService();