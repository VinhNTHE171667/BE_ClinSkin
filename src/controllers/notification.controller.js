import Notification from "../models/notification.model.js";

export const getNotificationsByUser = async (req, res) => {
  try {
    const { type = "STORE" } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const user = req.user;

    const filter = {
      recipient: user._id,
      model: "User",
      type,
    };

    // Debug: Check all notifications for this user
    const allUserNotifications = await Notification.find({
      recipient: user._id,
      model: "User",
    }).select("type title createdAt");

    console.log(
      "All user notifications:",
      JSON.stringify(allUserNotifications, null, 2)
    );

    // Debug: Check specific filter
    const specificFilterResult = await Notification.find(filter).select(
      "type title"
    );
    console.log("Specific filter result:", specificFilterResult);

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
    ]);

    const allNotifications = await Notification.find({})
      .select("recipient model type title")
      .limit(5);
    console.log("Sample notifications in database:", allNotifications);

    const userNotifications = await Notification.find({
      recipient: user._id,
      model: "User",
    });
    console.log(
      "All notifications for this user (no type filter):",
      userNotifications.length
    );

    const unreadCount = await Notification.countDocuments({
      ...filter,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      data: {
        page,
        pageSize: limit,
        totalItems: total,
        notifications,
        hasMore: total > page * limit,
        unreadCount,
      },
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông báo",
      data: [],
      error: error.message,
    });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const recipient = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông báo",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Đã đánh dấu thông báo là đã đọc",
      data: notification,
    });
  } catch (error) {
    console.error("Mark notification error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật thông báo",
      error: error.message,
    });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const { type } = req.body;
    const recipient = req.user._id;

    await Notification.updateMany(
      { recipient, type, isRead: false },
      { isRead: true }
    );

    return res.status(200).json({
      success: true,
      message: "Đã đánh dấu tất cả thông báo là đã đọc",
    });
  } catch (error) {
    console.error("Mark all notifications error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật thông báo",
      error: error.message,
    });
  }
};
