import express from "express";
import {
  loginUserValidate,
  registerUserValidate,
  resetPasswordValidate,
} from "../../validates/auth.validate.js";
import {
  login,
  register,
  sendOtp,
  verifyOtp,
  resetPassword,
  getAccountUser
} from "../../controllers/auth.controller.js";
import { validateMiddleWare } from "../../middleware/validate.middleware.js";
import { authMiddlewareUser } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.post("/login", loginUserValidate, validateMiddleWare, login);
router.post("/register", registerUserValidate, validateMiddleWare, register);
router.post("/verify-otp", verifyOtp);
router.post("/send-otp", sendOtp);
router.post(
  "/reset-password",
  resetPasswordValidate,
  validateMiddleWare,
  resetPassword
);
router.get("/account", authMiddlewareUser, getAccountUser);

export default router;
