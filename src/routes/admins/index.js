import express from "express";
import authRoutes from "./auth.admin-route.js";
import categoryRoutes from "./category.admin-route.js";
import { authMiddlewareAdmin } from "../../middleware/auth.middleware.js";
import {
  accessRole,
  ADMIN_ROLE,
  STAFF_ROLE,
  SUPPORT_ROLE,
} from "../../ultis/getRole.js";

import productRoutes from "./product.admin-route.js";
import promotionRoutes from "./promotion.admin-route.js";
import brandRoutes from "./brand.admin-route.js";
import userRoutes from "./user.admin-route.js";
import inventoryBatchRoutes from "./inventoryBatch.routes.js";
import salesHistoryRouters from "./sales-history.admin-route.js";
import dashboradRoutes from "./dashborad.admin-route.js";
import adminAccountRoutes from "./admin-account.admin-route.js";
import orderRoutes from "./order.admin-route.js";
import stockRoutes from "./stock.admin-route.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/product", productRoutes);
router.use("/promotions", promotionRoutes);
router.use(
  "/categories",
  authMiddlewareAdmin(accessRole([ADMIN_ROLE, STAFF_ROLE])),
  categoryRoutes
);
router.use("/brands", brandRoutes);
router.use(
  "/users",
  authMiddlewareAdmin(accessRole([ADMIN_ROLE, STAFF_ROLE])),
  userRoutes
);
router.use(
  "/inventory-batches",
  authMiddlewareAdmin(accessRole([ADMIN_ROLE, STAFF_ROLE])),
  inventoryBatchRoutes
);

router.use(
  "/sales-history",
  authMiddlewareAdmin(accessRole([ADMIN_ROLE, STAFF_ROLE])),
  salesHistoryRouters
);

router.use(
  "/dashboard",
  authMiddlewareAdmin(accessRole([ADMIN_ROLE])),
  dashboradRoutes
);

router.use(
  "/admin-accounts",
  authMiddlewareAdmin(accessRole([ADMIN_ROLE])),
  adminAccountRoutes
);

router.use(
  "/orders",
  authMiddlewareAdmin(accessRole([ADMIN_ROLE, STAFF_ROLE, SUPPORT_ROLE])),
  orderRoutes
);

router.use(
  "/stock",
  stockRoutes
);

export default router;
