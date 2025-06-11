import express from "express";
import promotionRoutes from "./promotion.admin-route.js";

const router = express.Router();

router.use("/promotion", promotionRoutes);

export default router;
