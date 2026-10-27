
const express = require("express");

const {
  cancelRefundController,
} = require("../controllers/cancelrefund");

// If your existing authentication middleware is required,
// import it here using its actual file path.

const router = express.Router();

// ==========================================
// CANCEL ORDER ITEM / VALIDATE REFUND
// ==========================================

// POST /api/cancel-refund/:orderId/:itemId
router.post(
  "/:orderId/:itemId",
  cancelRefundController
);

module.exports = router;
