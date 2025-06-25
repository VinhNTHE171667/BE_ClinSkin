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
}

export default new ProductSalesHistoryService();