import express from "express";
import authRoutes from "./auth.user-route.js";
import categoryRoutes from "./category.user-route.js";
import brandRoutes from "./brand.user-route.js";
import productRoutes from "./product.user-route.js";
import orderRoutes from "./order.user-route.js";

import promotionRoutes from "./promotion.user-route.js";

import notificationRoutes from "./notification.user-route.js";
import addressRoutes from "./address.user-route.js";
import reviewRoutes from "./review.user-route.js";


const router = express.Router();

router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/brands", brandRoutes);
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);

router.use("/promotion", promotionRoutes);

router.use("/notifications", notificationRoutes);
router.use("/address", addressRoutes);
router.use("/reviews", reviewRoutes);

export default router;
