
const {
  getWallet,
  getOrCreateWallet,
  createPendingWalletTransaction,
  creditWalletAfterPayPal,
  debitWallet
} = require("../repositories/wallet");

const paypalClient = require("../config/paypal");

const {
  OrdersController
} = require("@paypal/paypal-server-sdk");

const Order = require("../models/order");

const ordersController = new OrdersController(paypalClient);


/* =====================================
   GET USER WALLET
===================================== */

const GetWallet = async (userId) => {
  return await getOrCreateWallet(userId);
};


/* =====================================
   CREATE PAYPAL WALLET TOP-UP
===================================== */

const CreateWalletTopUp = async (userId, amount) => {

  const numericAmount = Number(amount);

  if (
    !Number.isFinite(numericAmount) ||
    numericAmount < 1 ||
    numericAmount > 100000
  ) {
    throw new Error("Enter a valid amount between 1 and 100000");
  }

  await getOrCreateWallet(userId);

  // INR to USD conversion
  const INR_TO_USD = Number(process.env.INR_TO_USD);

  if (!Number.isFinite(INR_TO_USD) || INR_TO_USD <= 0) {
    throw new Error("Invalid currency conversion rate");
  }

  const usdAmount = (numericAmount * INR_TO_USD).toFixed(2);

  // Create PayPal order
  const response = await ordersController.createOrder({
    body: {
      intent: "CAPTURE",
      purchaseUnits: [
        {
          amount: {
            currencyCode: "USD",
            value: usdAmount
          },
          description: "Wallet Top Up"
        }
      ]
    }
  });

  const paypalOrder = response.result;

  if (!paypalOrder?.id) {
    throw new Error("Unable to create PayPal order");
  }

  // Save pending transaction
  const wallet = await createPendingWalletTransaction(
    userId,
    {
      amount: numericAmount,
      paypalOrderId: paypalOrder.id,
      transactionId: `WAL-${Date.now()}`
    }
  );

  if (!wallet) {
    throw new Error("Unable to save wallet transaction");
  }

  return {
    paypalOrderId: paypalOrder.id,
    paypalStatus: paypalOrder.status,
    amount: numericAmount,
    currency: "INR"
  };
};


/* =====================================
   CAPTURE PAYPAL WALLET PAYMENT
===================================== */

const CaptureWalletTopUp = async (userId, paypalOrderId) => {

  if (!paypalOrderId) {
    throw new Error("PayPal order ID is required");
  }

  const wallet = await getWallet(userId);

  if (!wallet) {
    throw new Error("Wallet not found");
  }

  const pendingTransaction = wallet.transactions.find(
    (transaction) =>
      transaction.paypalOrderId === paypalOrderId &&
      transaction.status === "pending" &&
      transaction.paymentProvider === "PAYPAL"
  );

  if (!pendingTransaction) {
    throw new Error(
      "Pending transaction not found or already processed"
    );
  }

  // Capture PayPal payment
  const response = await ordersController.captureOrder({
    id: paypalOrderId
  });

  const captureResult = response.result;

  if (captureResult?.status !== "COMPLETED") {
    throw new Error("PayPal payment is not completed");
  }

  const capture = captureResult.purchaseUnits?.[0]
    ?.payments?.captures?.[0];

  if (!capture || capture.status !== "COMPLETED") {
    throw new Error("PayPal capture verification failed");
  }

  // Verify amount and currency
  const INR_TO_USD = Number(process.env.INR_TO_USD);

  if (!Number.isFinite(INR_TO_USD) || INR_TO_USD <= 0) {
    throw new Error("Invalid currency conversion rate");
  }

  const expectedAmount = (
    pendingTransaction.amount * INR_TO_USD
  ).toFixed(2);

  if (
    capture.amount?.currencyCode !== "USD" ||
    Number(capture.amount?.value).toFixed(2) !== expectedAmount
  ) {
    throw new Error("PayPal payment amount mismatch");
  }

  // Credit wallet exactly once
  const updatedWallet = await creditWalletAfterPayPal(
    userId,
    paypalOrderId,
    capture.id
  );

  if (!updatedWallet) {
    throw new Error("Unable to update wallet balance");
  }

  return {
    message: "Money added successfully",
    balance: updatedWallet.balance,
    wallet: updatedWallet
  };
};


/* =====================================
   WALLET PAYMENT
===================================== */

const WalletPayment = async (userId, orderId) => {

  if (!orderId) {
    throw new Error("Order ID is required");
  }

  // Find order belonging to logged-in user
  const order = await Order.findOne({
    _id: orderId,
    userId
  });

  if (!order) {
    throw new Error("Order not found");
  }

  // Verify payment method
  if (order.paymentmethod !== "WALLET") {
    throw new Error("Invalid payment method");
  }

  // Verify pending payment
  if (order.paymentstatus !== "pending") {
    throw new Error("Order is already paid or processed");
  }

  // Get actual amount from database
  const numericAmount = Number(order.total);

  if (
    !Number.isFinite(numericAmount) ||
    numericAmount <= 0
  ) {
    throw new Error("Invalid order amount");
  }

  // Deduct wallet balance
  const updatedWallet = await debitWallet(
    userId,
    {
      orderId: order._id,
      amount: numericAmount,
      description: "Order payment",
      transactionId: `WAL-PAY-${order._id}`
    }
  );

  if (!updatedWallet) {
    throw new Error("Insufficient wallet balance");
  }

  // Update order status
 // Confirm order only after successful wallet debit
// Update order status
// Confirm order only after successful wallet debit
// Update order status after successful wallet debit
order.paymentstatus = "paid";
order.orderstatus = "processing";

await order.save();

console.log("WALLET PAYMENT SUCCESS:", {
  orderId: order._id,
  paymentmethod: order.paymentmethod,
  paymentstatus: order.paymentstatus,
  orderstatus: order.orderstatus
});

  return {
    message: "Wallet payment successful",
    balance: updatedWallet.balance,
    order
  };
};


/* =====================================
   EXPORT
===================================== */

module.exports = {
  GetWallet,
  CreateWalletTopUp,
  CaptureWalletTopUp,
  WalletPayment
};
