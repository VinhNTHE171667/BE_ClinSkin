import express from "express";
import productRoutes from "./product.route.js";

const router = express.Router();

router.use("/product", productRoutes);

export default router;
