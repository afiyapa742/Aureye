const express = require("express");

const router = express.Router();

const {
  getOrdermy,
  cancelOrderItem,
  getInvoice,
  returnOrder,
} = require("../controllers/oderdetrail.js");

const protect =
  require("../auth/authMiddleware");

// ==========================================
// GET MY ORDERS
// ==========================================

router.get(
  "/",
  protect,
  getOrdermy
);

// ==========================================
// CANCEL ORDER ITEM
// ==========================================

router.put(
  "/order-item/cancel/:itemId",
  protect,
  cancelOrderItem
);

// ==========================================
// SINGLE RETURN ITEM
// ==========================================

router.put(
  "/order-item/return/:itemId",
  protect,
  returnOrder
);

// ==========================================
// BULK RETURN ITEMS
// ==========================================

router.put(
  "/order-items/return",
  protect,
  returnOrder
);

// ==========================================
// INDIVIDUAL INVOICE
// ==========================================

router.get(
  "/order/:orderId/invoice/:itemId",
  protect,
  getInvoice
);


// Invoice for the entire order
router.get(
  "/order/:orderId/invoice",
  protect,
  getInvoice
);
module.exports = router;