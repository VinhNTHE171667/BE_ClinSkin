import express from "express";
import { authMiddlewareUser } from "../../middleware/auth.middleware.js";
import { getNotificationsByUser, markAllNotificationsAsRead, markNotificationAsRead } from "../../controllers/notification.controller.js";
const router = express.Router();

router.get("/by-user", authMiddlewareUser, getNotificationsByUser);
router.post(
  "/mark-all-as-read",
  authMiddlewareUser,
  markAllNotificationsAsRead
);
router.put("/mark-as-read/:id", authMiddlewareUser, markNotificationAsRead);

export default router;
