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
                        },
                        totalCompletedAmount: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$status", "delivered"] },
                                    "$totalAmount",
                                    0
                                ]
                            }
                        },
                        totalPendingAmount: {
                            $sum: {
                                $cond: [
                                    { $in: ["$status", ["pending", "confirmed", "shipping"]] },
                                    "$totalAmount",
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
                        totalCompletedAmount: 1,
                        totalPendingAmount: 1,
                        month: month,
                        year: year
                    }
                }
            ]);

            if (result.length === 0) {
                return {
                    totalOrders: 0,
                    completedOrders: 0,
                    totalCompletedAmount: 0,
                    totalPendingAmount: 0,
                    month: month,
                    year: year
                };
            }

            return result[0];
        } catch (error) {
            throw new Error(`Lỗi khi lấy thống kê đơn hàng tháng ${month}/${year}: ${error.message}`);
        }
    }

    // Thống kê đơn hàng các ngày trong tháng
    async getDailyOrderStatsInMonth(year, month) {
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
                        _id: { $dayOfMonth: "$createdAt" },
                        totalOrders: { $sum: 1 },
                        completedOrders: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$status", "delivered"] },
                                    1,
                                    0
                                ]
                            }
                        },
                        processingOrders: {
                            $sum: {
                                $cond: [
                                    { $in: ["$status", ["pending", "confirmed", "shipping"]] },
                                    1,
                                    0
                                ]
                            }
                        },
                        cancelledOrders: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$status", "cancelled"] },
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                },
                {
                    $project: {
                        day: "$_id",
                        completedOrders: 1,
                        processingOrders: 1,
                        cancelledOrders: 1,
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
                    completedOrders: item.completedOrders,
                    processingOrders: item.processingOrders,
                    cancelledOrders: item.cancelledOrders
                }))
            };
        } catch (error) {
            throw new Error(`Lỗi khi lấy thống kê đơn hàng theo ngày tháng ${month}/${year}: ${error.message}`);
        }
    }

    // Thống kê đơn hàng các tháng trong năm
    async getMonthlyOrderStatsInYear(year) {
        try {
            const startDate = new Date(year, 0, 1);
            const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

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
                        _id: { $month: "$createdAt" },
                        totalOrders: { $sum: 1 },
                        completedOrders: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$status", "delivered"] },
                                    1,
                                    0
                                ]
                            }
                        },
                        processingOrders: {
                            $sum: {
                                $cond: [
                                    { $in: ["$status", ["pending", "confirmed", "shipping"]] },
                                    1,
                                    0
                                ]
                            }
                        },
                        cancelledOrders: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$status", "cancelled"] },
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                },
                {
                    $project: {
                        month: "$_id",
                        completedOrders: 1,
                        processingOrders: 1,
                        cancelledOrders: 1,
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
                    completedOrders: item.completedOrders,
                    processingOrders: item.processingOrders,
                    cancelledOrders: item.cancelledOrders
                }))
            };
        } catch (error) {
            throw new Error(`Lỗi khi lấy thống kê đơn hàng theo tháng năm ${year}: ${error.message}`);
        }
    }

    // Thống kê đơn hàng 5 năm gần nhất
    async getYearlyOrderStatsLastFiveYears() {
        try {
            const currentYear = new Date().getFullYear();
            const startYear = currentYear - 4;
            const startDate = new Date(startYear, 0, 1);
            const endDate = new Date(currentYear, 11, 31, 23, 59, 59, 999);

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
                        _id: { $year: "$createdAt" },
                        totalOrders: { $sum: 1 },
                        completedOrders: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$status", "delivered"] },
                                    1,
                                    0
                                ]
                            }
                        },
                        processingOrders: {
                            $sum: {
                                $cond: [
                                    { $in: ["$status", ["pending", "confirmed", "shipping"]] },
                                    1,
                                    0
                                ]
                            }
                        },
                        cancelledOrders: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$status", "cancelled"] },
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                },
                {
                    $project: {
                        year: "$_id",
                        completedOrders: 1,
                        processingOrders: 1,
                        cancelledOrders: 1,
                        _id: 0
                    }
                },
                {
                    $sort: { year: 1 }
                }
            ]);

            const yearlyData = result.map(item => ({
                year: item.year,
                completedOrders: item.completedOrders,
                processingOrders: item.processingOrders,
                cancelledOrders: item.cancelledOrders
            }));

            return {
                yearRange: `${startYear}-${currentYear}`,
                yearlyData: yearlyData
            };
        } catch (error) {
            throw new Error(`Lỗi khi lấy thống kê đơn hàng 5 năm gần nhất: ${error.message}`);
        }
    }
}

export default new OrderService();