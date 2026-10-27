const express = require("express");

const router = express.Router();

const {
  GetCart,
  AddCart,
  RemoveCart,
  UpdateCart
} = require("../controllers/cartController");

const protect = require("../auth/authMiddleware");

router.get("/", protect, GetCart);

router.post("/", protect, AddCart);

router.delete("/remove/:variantId", protect, RemoveCart);

router.put("/edit", protect, UpdateCart);

module.exports = router;