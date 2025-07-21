import express from "express";
import { authMiddlewareUser } from "../../middleware/auth.middleware.js";
import { createAddress, deleteAddress, getAllAddress, setDefaultAddress, updateAddress } from "../../controllers/address.controller.js";

const router = express.Router();

router.get("/", authMiddlewareUser, getAllAddress);
router.post("/", authMiddlewareUser, createAddress);
router.put("/:id", authMiddlewareUser, updateAddress);
router.delete("/:id", authMiddlewareUser, deleteAddress);
router.patch('/:id/set-default', authMiddlewareUser, setDefaultAddress);

export default router;
