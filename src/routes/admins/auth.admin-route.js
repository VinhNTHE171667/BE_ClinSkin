import express from "express";
import {
  getAccountAdmin,
  loginAdmin
} from "../../controllers/auth.controller.js";
import { validateMiddleWare } from "../../middleware/validate.middleware.js";
import { loginAdminValidate } from "../../validates/auth.validate.js";
import { authMiddlewareAdmin } from "../../middleware/auth.middleware.js";

import { getAllPromotions, 
  getPromotionById, 
  createPromotion, 
  updatePromotion, 
  deletePromotion } from "../../controllers/promotionController.js";
import { promotionValidationRules } from "../../validates/promotionValidator.js";

const router = express.Router();

router.post("/login", loginAdminValidate, validateMiddleWare, loginAdmin);
router.get(
  "/account",
  authMiddlewareAdmin(["ADMIN"]),
  getAccountAdmin
);


router.get('/promotion',promotionValidationRules,validateMiddleWare,getAllPromotions);
router.get('/promotion/:id',promotionValidationRules,validateMiddleWare, getPromotionById);
router.post('/promotion/createPromotion',promotionValidationRules,validateMiddleWare, createPromotion);
router.put('/promotion/updatePromotion/:id',promotionValidationRules,validateMiddleWare,updatePromotion);
router.delete('/promotion/deletePromotion/:id',promotionValidationRules,validateMiddleWare,deletePromotion);
export default router;
