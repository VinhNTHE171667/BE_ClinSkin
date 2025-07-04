import Review from "../models/review.js";

class ReviewService {
  async getReviewStatistics() {
    try {
      const [
        totalReviewsResult,
        averageRatingResult
      ] = await Promise.all([
        Review.aggregate([
          {
            $group: {
              _id: null,
              totalReviews: { $sum: 1 }
            }
          }
        ]),

        Review.aggregate([
          {
            $group: {
              _id: null,
              averageRating: { $avg: "$rate" }
            }
          }
        ])
      ]);

      return {
        totalReviews: totalReviewsResult[0]?.totalReviews || 0,
        averageRating: averageRatingResult[0]?.averageRating 
          ? parseFloat(averageRatingResult[0].averageRating.toFixed(2))
          : 0
      };
    } catch (error) {
      throw error;
    }
  }

  // Thống kê đánh giá các ngày trong tháng
  async getDailyReviewStatsInMonth(year, month) {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      const result = await Review.aggregate([
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
            totalReviews: { $sum: 1 },
            averageRating: { $avg: "$rate" }
          }
        },
        {
          $project: {
            day: "$_id",
            totalReviews: 1,
            averageRating: {
              $round: ["$averageRating", 2]
            },
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
          totalReviews: item.totalReviews,
          averageRating: item.averageRating || 0
        }))
      };
    } catch (error) {
      throw new Error(`Lỗi khi lấy thống kê đánh giá theo ngày tháng ${month}/${year}: ${error.message}`);
    }
  }

  // Thống kê đánh giá các tháng trong năm
  async getMonthlyReviewStatsInYear(year) {
    try {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

      const result = await Review.aggregate([
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
            totalReviews: { $sum: 1 },
            averageRating: { $avg: "$rate" }
          }
        },
        {
          $project: {
            month: "$_id",
            totalReviews: 1,
            averageRating: {
              $round: ["$averageRating", 2]
            },
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
          totalReviews: item.totalReviews,
          averageRating: item.averageRating || 0
        }))
      };
    } catch (error) {
      throw new Error(`Lỗi khi lấy thống kê đánh giá theo tháng năm ${year}: ${error.message}`);
    }
  }

  // Thống kê đánh giá 5 năm gần nhất
  async getYearlyReviewStatsLastFiveYears() {
    try {
      const currentYear = new Date().getFullYear();
      const startYear = currentYear - 4;
      const startDate = new Date(startYear, 0, 1);
      const endDate = new Date(currentYear, 11, 31, 23, 59, 59, 999);

      const result = await Review.aggregate([
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
            totalReviews: { $sum: 1 },
            averageRating: { $avg: "$rate" }
          }
        },
        {
          $project: {
            year: "$_id",
            totalReviews: 1,
            averageRating: {
              $round: ["$averageRating", 2]
            },
            _id: 0
          }
        },
        {
          $sort: { year: 1 }
        }
      ]);

      const yearlyData = result.map(item => ({
        year: item.year,
        totalReviews: item.totalReviews,
        averageRating: item.averageRating || 0
      }));

      return {
        yearRange: `${startYear}-${currentYear}`,
        yearlyData: yearlyData
      };
    } catch (error) {
      throw new Error(`Lỗi khi lấy thống kê đánh giá 5 năm gần nhất: ${error.message}`);
    }
  }
}

export default new ReviewService();
