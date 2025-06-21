import express from "express";
import authRoutes from "./auth.user-route.js";
import categoryRoutes from "./category.user-route.js";
import brandRoutes from "./brand.user-route.js";
import productRoutes from "./product.user-route.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/brands", brandRoutes);
router.use("/products", productRoutes);

export default router;
