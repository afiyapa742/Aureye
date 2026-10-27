
const express = require("express");

const router = express.Router();

const {
  getWalletController,
  createWalletTopUpController,
  captureWalletTopUpController,
  walletPaymentController
} = require("../controllers/wallet");

const protect = require("../auth/authMiddleware");


/* GET WALLET */
router.get(
  "/",
  protect,
  getWalletController
);


/* CREATE PAYPAL ORDER */
router.post(
  "/paypal/create-order",
  protect,
  createWalletTopUpController
);


/* CAPTURE PAYPAL PAYMENT */
router.post(
  "/paypal/capture-order",
  protect,
  captureWalletTopUpController
);


/* WALLET PAYMENT */
router.post(
  "/payment",
  protect,
  walletPaymentController
);


module.exports = router;