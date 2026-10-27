const express = require("express");

const router =
  express.Router();

const {
  createPaypalOrderController,
  capturePaypalOrderController,
  paymentFailedController
} = require("../controllers/payment");

const protect =
  require("../auth/authMiddleware");


/* =====================================================
   CREATE PAYPAL ORDER
===================================================== */

router.post(
  "/paypal/create-order",
  protect,
  createPaypalOrderController
);


/* =====================================================
   CAPTURE PAYPAL PAYMENT
===================================================== */

router.post(
  "/paypal/capture-order",
  protect,
  capturePaypalOrderController
);


/* =====================================================
   PAYMENT FAILED
===================================================== */

router.post(
  "/paypal/payment-failed",
  protect,
  paymentFailedController
);


module.exports = router;