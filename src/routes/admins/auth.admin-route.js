import express from "express";
import {
  getAccountAdmin,
  loginAdmin
} from "../../controllers/auth.controller.js";
import { validateMiddleWare } from "../../middleware/validate.middleware.js";
import { loginAdminValidate } from "../../validates/auth.validate.js";
import { authMiddlewareAdmin } from "../../middleware/auth.middleware.js";

import { searchProductByName } from "../../controllers/productController.js";

const router = express.Router();

router.post("/login", loginAdminValidate, validateMiddleWare, loginAdmin);
router.get(
  "/account",
  authMiddlewareAdmin(["ADMIN"]),
  getAccountAdmin
);

export default router;
