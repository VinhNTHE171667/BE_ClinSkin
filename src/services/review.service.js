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
}

export default new ReviewService();
