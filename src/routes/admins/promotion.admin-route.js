import express from "express";
import { createPromotion, deletePromotion, getAllPromotions, getPromotionById, updatePromotion } from "../../controllers/promotionController.js";
import { promotionValidationRules } from "../../validates/promotionValidator.js";
import { validateMiddleWare } from "../../middleware/validate.middleware.js";

const router = express.Router();

router.get('/',getAllPromotions);
router.get('/:id',getPromotionById);
router.post('/createPromotion',promotionValidationRules,validateMiddleWare, createPromotion);
router.put('/updatePromotion/:id',updatePromotion);
router.delete('/deletePromotion/:id',deletePromotion);

export default router;