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

const router = express.Router();

router.post("/login", loginAdminValidate, validateMiddleWare, loginAdmin);
router.get(
  "/account",
  authMiddlewareAdmin(["ADMIN"]),
  getAccountAdmin
);


router.get('/promotion',getAllPromotions);
router.get('/promotion/:id', getPromotionById);
router.post('/promotion/createPromotion', createPromotion);
router.put('/promotion/updatePromotion/:id',updatePromotion);
router.delete('/promotion/deletePromotion/:id',deletePromotion);
export default router;
