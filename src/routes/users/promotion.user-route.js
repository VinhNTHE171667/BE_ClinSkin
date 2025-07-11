import express from "express";
import { getActivePromotions, getListFromPromotion, getPromotionalProducts } from "../../controllers/promotion.controller.js";


const router = express.Router();

router.get("/promotionProduct",getPromotionalProducts);
router.get("/active",getActivePromotions);
router.get("/promotionProduct/:slug",getListFromPromotion);
export default router;