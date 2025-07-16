import express from "express";
import { authMiddlewareUser } from "../../middleware/auth.middleware.js";
import { getNotificationsByUser } from "../../controllers/notification.controller.js";
const router = express.Router();    

router.get("/by-user", authMiddlewareUser, getNotificationsByUser);

export default router;
