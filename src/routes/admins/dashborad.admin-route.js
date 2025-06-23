import express from "express";
import {getProductsWithNearExpiryBatches} from "../../controllers/dashborad.controller.js";

const router = express.Router();

router.get("/products-near-expiry", getProductsWithNearExpiryBatches);

export default router;

