import express from "express";
import {
  getAccountAdmin,
  loginAdmin,
  updateProfileAdmin
} from "../../controllers/auth.controller.js";
import { validateMiddleWare } from "../../middleware/validate.middleware.js";
import { loginAdminValidate } from "../../validates/auth.validate.js";
import { authMiddlewareAdmin } from "../../middleware/auth.middleware.js";
import multer from "multer";
import { ADMIN_ROLE, STAFF_ROLE } from "../../ultis/getRole.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });
router.post("/login", loginAdminValidate, validateMiddleWare, loginAdmin);
router.get(
  "/account",
  authMiddlewareAdmin([ADMIN_ROLE, STAFF_ROLE]),
  getAccountAdmin
);
router.put(
  "/update-profile/:id",
  authMiddlewareAdmin([ADMIN_ROLE, STAFF_ROLE]),
  upload.single("avatar"),
  updateProfileAdmin)

export default router;
