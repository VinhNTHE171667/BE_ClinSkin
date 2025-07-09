import express from "express";
import { updateAccountAdmin } from "../../controllers/admin.controller.js";

const router = express.Router();

router.put("/:id", updateAccountAdmin);

export default router;
