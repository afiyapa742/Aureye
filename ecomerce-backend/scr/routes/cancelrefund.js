
const express = require("express");

const {
  cancelRefundController,
} = require("../controllers/cancelrefund");

const protect = require("../auth/authMiddleware");

const router = express.Router();

// ==========================================
// CANCEL ORDER ITEM / VALIDATE REFUND
// POST /api/cancel-refund/:orderId/:itemId
// ==========================================

router.post(
  "/:orderId/:itemId",
  protect,
  cancelRefundController
);

module.exports = router;
