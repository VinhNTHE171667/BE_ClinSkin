import express from "express";
import authRoutes from "./auth.admin-route.js";
import categoryRoutes from "./category.admin-route.js";
import { authMiddlewareAdmin } from "../../middleware/auth.middleware.js";
import {
  accessRole,
  ADMIN_ROLE,
} from "../../ultis/getRole.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use(
    "/categories",
    authMiddlewareAdmin(accessRole([ADMIN_ROLE])),
    categoryRoutes
);

export default router;
