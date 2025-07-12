import mongoose from "mongoose";
import ProductSalesHistory from "../models/ProductSalesHistory.model.js";
import Product from "../models/product.js";

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

    // Lấy danh sách sản phẩm bán chạy nhất theo tháng
    async getBestSellingProductsByMonth(year, month, page = 1, limit = 10) {
        try {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59, 999);
            
            // Tính dữ liệu tháng trước để so sánh
            const prevMonth = month === 1 ? 12 : month - 1;
            const prevYear = month === 1 ? year - 1 : year;
            const prevStartDate = new Date(prevYear, prevMonth - 1, 1);
            const prevEndDate = new Date(prevYear, prevMonth, 0, 23, 59, 59, 999);

            const skip = (page - 1) * limit;

            // Lấy dữ liệu tháng hiện tại
            const currentMonthData = await ProductSalesHistory.aggregate([
                {
                    $match: {
                        saleDate: { $gte: startDate, $lte: endDate },
                        isCompleted: true
                    }
                },
                {
                    $group: {
                        _id: "$productId",
                        totalQuantity: { $sum: "$quantity" },
                        totalRevenue: { $sum: "$totalRevenue" },
                        totalCost: { $sum: "$totalCost" },
                        totalOrders: { $sum: 1 }
                    }
                },
                {
                    $lookup: {
                        from: "products",
                        localField: "_id",
                        foreignField: "_id",
                        as: "product"
                    }
                },
                {
                    $unwind: "$product"
                },
                {
                    $lookup: {
                        from: "brands",
                        localField: "product.brandId",
                        foreignField: "_id",
                        as: "brand"
                    }
                },
                {
                    $unwind: { path: "$brand", preserveNullAndEmptyArrays: true }
                },
                {
                    $project: {
                        productId: "$_id",
                        productInfo: {
                            _id: "$product._id",
                            name: "$product.name",
                            slug: "$product.slug",
                            price: "$product.price",
                            mainImage: "$product.mainImage",
                            brand: "$brand.name",
                            totalRating: "$product.totalRating",
                            ratingCount: "$product.ratingCount"
                        },
                        currentMonth: {
                            totalQuantity: "$totalQuantity",
                            totalRevenue: "$totalRevenue",
                            totalCost: "$totalCost",
                            grossProfit: { $subtract: ["$totalRevenue", "$totalCost"] },
                            totalOrders: "$totalOrders"
                        },
                        _id: 0
                    }
                },
                {
                    $sort: { "currentMonth.totalQuantity": -1 }
                }
            ]);
            // Lấy dữ liệu tháng trước để so sánh
            const prevMonthData = await ProductSalesHistory.aggregate([
                {
                    $match: {
                        saleDate: { $gte: prevStartDate, $lte: prevEndDate },
                        isCompleted: true
                    }
                },
                {
                    $group: {
                        _id: "$productId",
                        totalQuantity: { $sum: "$quantity" },
                        totalRevenue: { $sum: "$totalRevenue" }
                    }
                }
            ]);

            // Tạo map để dễ tra cứu dữ liệu tháng trước
            const prevMonthMap = {};
            prevMonthData.forEach(item => {
                prevMonthMap[item._id.toString()] = {
                    totalQuantity: item.totalQuantity,
                    totalRevenue: item.totalRevenue
                };
            });

            // Tính toán tỷ lệ tăng/giảm và kết hợp dữ liệu
            const productsWithComparison = currentMonthData.map(item => {
                const productId = item.productId.toString();
                const prevData = prevMonthMap[productId] || { totalQuantity: 0, totalRevenue: 0 };

                // Tính tỷ lệ thay đổi số lượng
                const quantityChangePercent = prevData.totalQuantity > 0 
                    ? ((item.currentMonth.totalQuantity - prevData.totalQuantity) / prevData.totalQuantity) * 100
                    : item.currentMonth.totalQuantity > 0 ? 100 : 0;

                // Tính tỷ lệ thay đổi doanh thu
                const revenueChangePercent = prevData.totalRevenue > 0 
                    ? ((item.currentMonth.totalRevenue - prevData.totalRevenue) / prevData.totalRevenue) * 100
                    : item.currentMonth.totalRevenue > 0 ? 100 : 0;

                return {
                    ...item,
                    previousMonth: {
                        totalQuantity: prevData.totalQuantity,
                        totalRevenue: prevData.totalRevenue
                    },
                    comparison: {
                        quantityChange: item.currentMonth.totalQuantity - prevData.totalQuantity,
                        quantityChangePercent: Math.round(quantityChangePercent * 100) / 100,
                        revenueChange: item.currentMonth.totalRevenue - prevData.totalRevenue,
                        revenueChangePercent: Math.round(revenueChangePercent * 100) / 100
                    }
                };
            });

            // Phân trang
            const total = productsWithComparison.length;
            const paginatedProducts = productsWithComparison.slice(skip, skip + limit);

            return {
                products: paginatedProducts,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: limit,
                    hasNextPage: page < Math.ceil(total / limit),
                    hasPrevPage: page > 1
                },
                summary: {
                    year: year,
                    month: month,
                    totalProducts: total,
                    comparisonMonth: `${prevMonth}/${prevYear}`
                }
            };

        } catch (error) {
            throw new Error(`Lỗi khi lấy danh sách sản phẩm bán chạy tháng ${month}/${year}: ${error.message}`);
        }
    }

    // Lấy danh sách sản phẩm bán chạy nhất theo năm
    async getBestSellingProductsByYear(year, page = 1, limit = 10) {
        try {
            const startDate = new Date(year, 0, 1);
            const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
            
            // Tính dữ liệu năm trước để so sánh
            const prevYear = year - 1;
            const prevStartDate = new Date(prevYear, 0, 1);
            const prevEndDate = new Date(prevYear, 11, 31, 23, 59, 59, 999);

            const skip = (page - 1) * limit;

            // Lấy dữ liệu năm hiện tại
            const currentYearData = await ProductSalesHistory.aggregate([
                {
                    $match: {
                        saleDate: { $gte: startDate, $lte: endDate },
                        isCompleted: true
                    }
                },
                {
                    $group: {
                        _id: "$productId",
                        totalQuantity: { $sum: "$quantity" },
                        totalRevenue: { $sum: "$totalRevenue" },
                        totalCost: { $sum: "$totalCost" },
                        totalOrders: { $sum: 1 }
                    }
                },
                {
                    $lookup: {
                        from: "products",
                        localField: "_id",
                        foreignField: "_id",
                        as: "product"
                    }
                },
                {
                    $unwind: "$product"
                },
                {
                    $lookup: {
                        from: "brands",
                        localField: "product.brandId",
                        foreignField: "_id",
                        as: "brand"
                    }
                },
                {
                    $unwind: { path: "$brand", preserveNullAndEmptyArrays: true }
                },
                {
                    $project: {
                        productId: "$_id",
                        productInfo: {
                            _id: "$product._id",
                            name: "$product.name",
                            slug: "$product.slug",
                            price: "$product.price",
                            mainImage: "$product.mainImage",
                            brand: "$brand.name",
                            totalRating: "$product.totalRating",
                            ratingCount: "$product.ratingCount"
                        },
                        currentYear: {
                            totalQuantity: "$totalQuantity",
                            totalRevenue: "$totalRevenue",
                            totalCost: "$totalCost",
                            grossProfit: { $subtract: ["$totalRevenue", "$totalCost"] },
                            totalOrders: "$totalOrders"
                        },
                        _id: 0
                    }
                },
                {
                    $sort: { "currentYear.totalQuantity": -1 }
                }
            ]);

            // Lấy dữ liệu năm trước để so sánh
            const prevYearData = await ProductSalesHistory.aggregate([
                {
                    $match: {
                        saleDate: { $gte: prevStartDate, $lte: prevEndDate },
                        isCompleted: true
                    }
                },
                {
                    $group: {
                        _id: "$productId",
                        totalQuantity: { $sum: "$quantity" },
                        totalRevenue: { $sum: "$totalRevenue" }
                    }
                }
            ]);

            // Tạo map để dễ tra cứu dữ liệu năm trước
            const prevYearMap = {};
            prevYearData.forEach(item => {
                prevYearMap[item._id.toString()] = {
                    totalQuantity: item.totalQuantity,
                    totalRevenue: item.totalRevenue
                };
            });

            // Tính toán tỷ lệ tăng/giảm và kết hợp dữ liệu
            const productsWithComparison = currentYearData.map(item => {
                const productId = item.productId.toString();
                const prevData = prevYearMap[productId] || { totalQuantity: 0, totalRevenue: 0 };

                // Tính tỷ lệ thay đổi số lượng
                const quantityChangePercent = prevData.totalQuantity > 0 
                    ? ((item.currentYear.totalQuantity - prevData.totalQuantity) / prevData.totalQuantity) * 100
                    : item.currentYear.totalQuantity > 0 ? 100 : 0;

                // Tính tỷ lệ thay đổi doanh thu
                const revenueChangePercent = prevData.totalRevenue > 0 
                    ? ((item.currentYear.totalRevenue - prevData.totalRevenue) / prevData.totalRevenue) * 100
                    : item.currentYear.totalRevenue > 0 ? 100 : 0;

                return {
                    ...item,
                    previousYear: {
                        totalQuantity: prevData.totalQuantity,
                        totalRevenue: prevData.totalRevenue
                    },
                    comparison: {
                        quantityChange: item.currentYear.totalQuantity - prevData.totalQuantity,
                        quantityChangePercent: Math.round(quantityChangePercent * 100) / 100,
                        revenueChange: item.currentYear.totalRevenue - prevData.totalRevenue,
                        revenueChangePercent: Math.round(revenueChangePercent * 100) / 100
                    }
                };
            });

            // Phân trang
            const total = productsWithComparison.length;
            const paginatedProducts = productsWithComparison.slice(skip, skip + limit);

            return {
                products: paginatedProducts,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: limit,
                    hasNextPage: page < Math.ceil(total / limit),
                    hasPrevPage: page > 1
                },
                summary: {
                    year: year,
                    totalProducts: total,
                    comparisonYear: prevYear
                }
            };

        } catch (error) {
            throw new Error(`Lỗi khi lấy danh sách sản phẩm bán chạy năm ${year}: ${error.message}`);
        }
    }

    async getProductLineChartByYear(productId, year) {
        try {
            const startDate = new Date(year, 0, 1);
            const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

            const currentYearData = await ProductSalesHistory.aggregate([
                {
                    $match: {
                        productId: new mongoose.Types.ObjectId(productId),
                        saleDate: { $gte: startDate, $lte: endDate },
                        isCompleted: true
                    }
                },
                {
                    $group: {
                        _id: { $month: "$saleDate" },
                        totalQuantity: { $sum: "$quantity" },
                        totalRevenue: { $sum: "$totalRevenue" },
                        totalCost: { $sum: "$totalCost" },
                        totalOrders: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        month: "$_id",
                        totalQuantity: 1,
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

            const productInfo = await Product.findById(productId)
                .populate('brandId', 'name')
                .select('_id name slug price mainImage')
                .lean();

            const monthlyData = [];
            const dataMap = {};
            
            currentYearData.forEach(item => {
                dataMap[item.month] = item;
            });

            for (let month = 1; month <= 12; month++) {
                const data = dataMap[month] || {
                    month: month,
                    totalQuantity: 0,
                    totalRevenue: 0,
                    totalCost: 0,
                    grossProfit: 0,
                    totalOrders: 0
                };
                
                monthlyData.push({
                    month: month,
                    totalQuantity: data.totalQuantity,
                    totalRevenue: data.totalRevenue,
                    totalCost: data.totalCost,
                    grossProfit: data.grossProfit,
                    totalOrders: data.totalOrders
                });
            }

            const yearSummary = monthlyData.reduce((acc, curr) => ({
                totalQuantity: acc.totalQuantity + curr.totalQuantity,
                totalRevenue: acc.totalRevenue + curr.totalRevenue,
                totalCost: acc.totalCost + curr.totalCost,
                grossProfit: acc.grossProfit + curr.grossProfit,
                totalOrders: acc.totalOrders + curr.totalOrders
            }), {
                totalQuantity: 0,
                totalRevenue: 0,
                totalCost: 0,
                grossProfit: 0,
                totalOrders: 0
            });

            return {
                productInfo: productInfo,
                year: year,
                monthlyData: monthlyData,
                yearSummary: yearSummary
            };

        } catch (error) {
            throw new Error(`Lỗi khi lấy thống kê lineChart sản phẩm năm ${year}: ${error.message}`);
        }
    }
}

export default new ProductSalesHistoryService();