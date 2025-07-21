export const getReviewLookupStagePro = () => ({
  $lookup: {
    from: "reviews",
    let: { productId: "$_id" },
    pipeline: [
      {
        $match: {
          $expr: { $eq: ["$productId", "$$productId"] },
          display: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: "$userDetails" },
      {
        $project: {
          _id: 1,
          rate: 1,
          comment: 1,
          images: 1,
          reply: 1,
          createdAt: 1,
          user: {
            _id: "$userDetails._id",
            name: "$userDetails.name",
            avatar: "$userDetails.avatar",
          },
        },
      },
    ],
    as: "reviews",
  },
});

export const getReviewFieldsStagePro = () => ({
  $addFields: {
    totalReviews: { $size: "$reviews" },
    averageRating: {
      $cond: {
        if: { $gt: [{ $size: "$reviews" }, 0] },
        then: { $round: [{ $avg: "$reviews.rate" }, 1] },
        else: 0,
      },
    },
    ratingDistribution: {
      $reduce: {
        input: "$reviews.rate",
        initialValue: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        in: {
          1: { $add: ["$$value.1", { $cond: [{ $eq: ["$$this", 1] }, 1, 0] }] },
          2: { $add: ["$$value.2", { $cond: [{ $eq: ["$$this", 2] }, 1, 0] }] },
          3: { $add: ["$$value.3", { $cond: [{ $eq: ["$$this", 3] }, 1, 0] }] },
          4: { $add: ["$$value.4", { $cond: [{ $eq: ["$$this", 4] }, 1, 0] }] },
          5: { $add: ["$$value.5", { $cond: [{ $eq: ["$$this", 5] }, 1, 0] }] },
        },
      },
    },
  },
});
