import express from "express";
import {
  getProductsWithNearExpiryBatches,
  getMonthlyStatistic,
  getOverallStatistics,
  getDailyRevenueInMonth,
  getMonthlyRevenueInYear,
  getYearlyRevenueLastFiveYears
} from "../../controllers/dashborad.controller.js";

const router = express.Router();

router.get("/products-near-expiry", getProductsWithNearExpiryBatches);
router.get("/monthly-statistic", getMonthlyStatistic);
router.get("/overall-statistic", getOverallStatistics);

router.get("/revenue/daily/:year/:month", getDailyRevenueInMonth);
router.get("/revenue/monthly/:year", getMonthlyRevenueInYear);
router.get("/revenue/yearly", getYearlyRevenueLastFiveYears);

export default router;
