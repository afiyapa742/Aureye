const express = require("express");

const router = express.Router();

const {
  CreateOrder,
  GetOrder,
  GetOrderItems,
  GetOrderPayment,
  UpdateOrderStatus,
  UpdatePaymentStatus
} = require("../controllers/checkout");

const protect = require("../auth/authMiddleware");


// ==========================================
// CREATE ORDER FROM CHECKOUT
// ==========================================

router.post(
  "/place-order",
  protect,
  CreateOrder
);


// ==========================================
// GET ORDER
// ==========================================

router.get(
  "/order/:id",
  protect,
  GetOrder
);


// ==========================================
// GET ORDER ITEMS
// ==========================================

router.get(
  "/order/:id/items",
  protect,
  GetOrderItems
);


// ==========================================
// GET PAYMENT
// ==========================================

router.get(
  "/order/:id/payment",
  protect,
  GetOrderPayment
);


// ==========================================
// UPDATE ORDER STATUS
// ==========================================

router.put(
  "/order/status/:id",
  protect,
  UpdateOrderStatus
);


// ==========================================
// UPDATE PAYMENT STATUS
// ==========================================

router.put(
  "/order/payment/status/:id",
  protect,
  UpdatePaymentStatus
);


module.exports = router;