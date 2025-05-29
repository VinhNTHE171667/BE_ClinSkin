import express from "express";
import {
  loginUserValidate,
  registerUserValidate,
} from "../../validates/auth.validate.js";
import {
  login,
  register,
  sendOtp,
  verifyOtp,
} from "../../controllers/auth.controller.js";
import { validateMiddleWare } from "../../middleware/validate.middleware.js";

const router = express.Router();

router.post("/login", loginUserValidate, validateMiddleWare, login);
router.post("/register", registerUserValidate, validateMiddleWare, register);
router.post("/verify-otp", verifyOtp);
router.post("/send-otp", sendOtp);

export default router;
