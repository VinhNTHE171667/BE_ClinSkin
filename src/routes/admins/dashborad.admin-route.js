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
  getYearlyReviewStatsLastFiveYears,
  getBestSellingProductsByMonth,
  getBestSellingProductsByYear,
  getProductLineChartByYear,
  getProductLineChartByLastFiveYears
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

router.get("/best-selling-products/:year/:month", getBestSellingProductsByMonth);
router.get("/best-selling-products/:year", getBestSellingProductsByYear);

router.get("/product-chart/:productId/five-years", getProductLineChartByLastFiveYears);
router.get("/product-chart/:productId/:year", getProductLineChartByYear);

export default router;
