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

export const saveUser = async (profile, done) => {
  try {
    const existingUser = await User.findOne({
      email: profile.emails[0].value,
    });

    if (existingUser) {
      if (existingUser.isActive && !existingUser.googleId) {
        return done(null, false, {
          message: "Tài khoản đã tồn tại vui lòng thử lại",
          isExist: true,
        });
      }
      existingUser.googleId = profile.id;
      existingUser.isActive = true;
      await existingUser.save();
      return done(null, existingUser);
    }
    const newUser = new User({
      googleId: profile.id,
      name: profile.displayName,
      email: profile.emails[0].value,
      avatar: {
        url: profile.photos[0].value,
        publicId: "",
      },
      password: "",
      isActive: true,
    });
    await newUser.save();
    done(null, newUser);
  } catch (error) {
    done(error, null);
  }
};

export default new UserService();
