import Order from "../models/order.js";

class OrderService {
    async getMonthlyOrderStats(year, month) {
        try {
            const startDate = new Date(year, month - 1, 1); 
            const endDate = new Date(year, month, 0, 23, 59, 59, 999); 
            
            const result = await Order.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: startDate,
                            $lte: endDate
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        completedOrders: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$status", "delivered"] },
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalOrders: 1,
                        completedOrders: 1,
                        month: month,
                        year: year
                    }
                }
            ]);

            if (result.length === 0) {
                return {
                    totalOrders: 0,
                    completedOrders: 0,
                    month: month,
                    year: year
                };
            }

            return result[0];
        } catch (error) {
            throw new Error(`Lỗi khi lấy thống kê đơn hàng tháng ${month}/${year}: ${error.message}`);
        }
    }
}

export default new OrderService();