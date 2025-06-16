import express from "express";
import authRoutes from "./auth.user-route.js";
import categoryRoutes from "./category.user-route.js";
import brandRoutes from "./brand.user-route.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/brands", brandRoutes);

export default router;
