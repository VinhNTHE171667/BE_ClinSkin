import express from "express";

import { createAddress, deleteAddress, getAllAddress, setDefaultAddress, updateAddress } from "../../controllers/address.controller.js";

const router = express.Router();

router.get("/", getAllAddress);
router.post("/", createAddress);
router.put("/:id", updateAddress);
router.delete("/:id", deleteAddress);
router.patch('/:id/set-default', setDefaultAddress);

export default router;
