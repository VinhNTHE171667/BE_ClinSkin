import express from "express";
import authRoutes from "./auth.user-route.js";

const router = express.Router();

router.use("/auth", authRoutes);

export default router;
