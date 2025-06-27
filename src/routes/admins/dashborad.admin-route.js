import express from "express";
import {getProductsWithNearExpiryBatches, getMonthlyStatistic} from "../../controllers/dashborad.controller.js";

const router = express.Router();

router.get("/products-near-expiry", getProductsWithNearExpiryBatches);
router.get("/monthly-statistic", getMonthlyStatistic);

export default router;

