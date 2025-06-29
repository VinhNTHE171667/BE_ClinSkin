import express from "express";
import {
  getProductsWithNearExpiryBatches,
  getMonthlyStatistic,
  getOverallStatistics,
  getDailyRevenueInMonth,
  getMonthlyRevenueInYear,
  getYearlyRevenueLastFiveYears,
  getDailyOrderStatsInMonth,
  getMonthlyOrderStatsInYear,
  getYearlyOrderStatsLastFiveYears,
  getDailyReviewStatsInMonth,
  getMonthlyReviewStatsInYear,
  getYearlyReviewStatsLastFiveYears
} from "../../controllers/dashborad.controller.js";

const router = express.Router();

router.get("/products-near-expiry", getProductsWithNearExpiryBatches);
router.get("/monthly-statistic", getMonthlyStatistic);
router.get("/overall-statistic", getOverallStatistics);

router.get("/revenue/daily/:year/:month", getDailyRevenueInMonth);
router.get("/revenue/monthly/:year", getMonthlyRevenueInYear);
router.get("/revenue/yearly", getYearlyRevenueLastFiveYears);

router.get("/orders/daily/:year/:month", getDailyOrderStatsInMonth);
router.get("/orders/monthly/:year", getMonthlyOrderStatsInYear);
router.get("/orders/yearly", getYearlyOrderStatsLastFiveYears);

router.get("/reviews/daily/:year/:month", getDailyReviewStatsInMonth);
router.get("/reviews/monthly/:year", getMonthlyReviewStatsInYear);
router.get("/reviews/yearly", getYearlyReviewStatsLastFiveYears);

export default router;
