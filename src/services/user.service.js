import User from "../models/user.model.js";

class UserService {

  async getUserStatistics() {
    try {
      const currentDate = new Date();
      const startDate = new Date();
      startDate.setDate(currentDate.getDate() - 30);

      const [
        totalUsersResult,
        newUsersResult
      ] = await Promise.all([
        User.aggregate([
          {
            $group: {
              _id: null,
              totalUsers: { $sum: 1 }
            }
          }
        ]),

        User.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate, $lte: currentDate }
            }
          },
          {
            $group: {
              _id: null,
              newUsers: { $sum: 1 }
            }
          }
        ])
      ]);

      return {
        totalUsers: totalUsersResult[0]?.totalUsers || 0,
        newUsersLast30Days: newUsersResult[0]?.newUsers || 0
      };
    } catch (error) {
      throw error;
    }
  }
}

export default new UserService();
