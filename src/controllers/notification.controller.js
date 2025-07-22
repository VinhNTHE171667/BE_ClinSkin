import Notification from "../models/notification.model.js";

// GET /notifications/by-user
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

        const [notifications, total] = await Promise.all([
            Notification.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Notification.countDocuments(filter),
        ]);

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