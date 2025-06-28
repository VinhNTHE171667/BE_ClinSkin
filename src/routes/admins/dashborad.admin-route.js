import express from "express";
import {
  getProductsWithNearExpiryBatches,
  getMonthlyStatistic,
  getOverallStatistics,
} from "../../controllers/dashborad.controller.js";

const router = express.Router();

router.get("/products-near-expiry", getProductsWithNearExpiryBatches);
router.get("/monthly-statistic", getMonthlyStatistic);
router.get("/overall-statistic", getOverallStatistics);

export default router;
