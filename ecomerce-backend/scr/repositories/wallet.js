const Wallet = require("../models/wallet");


/* =====================================
   GET USER WALLET
===================================== */

const getWallet = async (userId) => {
  return await Wallet.findOne({ userId });
};


/* =====================================
   CREATE WALLET
===================================== */

const createWallet = async (userId) => {
  return await Wallet.create({
    userId,
    balance: 0,
    transactions: []
  });
};


/* =====================================
   GET OR CREATE WALLET
===================================== */

const getOrCreateWallet = async (userId) => {

  let wallet = await Wallet.findOne({ userId });

  if (!wallet) {
    try {
      wallet = await Wallet.create({
        userId,
        balance: 0,
        transactions: []
      });

    } catch (error) {

      if (error.code === 11000) {
        wallet = await Wallet.findOne({ userId });
      } else {
        throw error;
      }
    }
  }

  return wallet;
};


/* =====================================
   CREATE PENDING PAYPAL TRANSACTION
===================================== */

const createPendingWalletTransaction = async (
  userId,
  transactionData
) => {

  if (!transactionData.paypalOrderId) {
    throw new Error("PayPal order ID is required");
  }

  // Check duplicate PayPal order ID
  const existingTransaction = await Wallet.findOne({
    "transactions.paypalOrderId":
      transactionData.paypalOrderId
  });

  if (existingTransaction) {
    throw new Error("PayPal transaction already exists");
  }

  return await Wallet.findOneAndUpdate(
    { userId },
    {
      $push: {
        transactions: {
          amount: transactionData.amount,
          type: "credit",
          status: "pending",
          refundStatus: "pending",

          paymentProvider: "PAYPAL",

          paypalOrderId:
            transactionData.paypalOrderId,

          paypalAmount:
            transactionData.paypalAmount,

          paypalCurrency:
            transactionData.paypalCurrency || "USD",

          conversionRate:
            transactionData.conversionRate,

          transactionId:
            transactionData.transactionId,

          description:
            transactionData.description ||
            "Wallet money added through PayPal"
        }
      }
    },
    {
      new: true,
      runValidators: true
    }
  );
};


/* =====================================
   CREDIT WALLET AFTER PAYPAL SUCCESS
===================================== */

const creditWalletAfterPayPal = async (
  userId,
  paypalOrderId,
  captureTransactionId
) => {

  if (!captureTransactionId) {
    throw new Error(
      "PayPal capture transaction ID is required"
    );
  }

  if (!paypalOrderId) {
    throw new Error(
      "PayPal order ID is required"
    );
  }

  // Find user's wallet and pending transaction
  const wallet = await Wallet.findOne({
    userId,
    transactions: {
      $elemMatch: {
        paypalOrderId,
        status: "pending",
        paymentProvider: "PAYPAL"
      }
    }
  });

  if (!wallet) {
    throw new Error(
      "Pending transaction not found or already processed"
    );
  }

  const transaction = wallet.transactions.find(
    (item) =>
      item.paypalOrderId === paypalOrderId &&
      item.status === "pending" &&
      item.paymentProvider === "PAYPAL"
  );

  if (!transaction) {
    throw new Error(
      "Invalid pending PayPal transaction"
    );
  }

  // Atomic update
  const updatedWallet =
    await Wallet.findOneAndUpdate(
      {
        _id: wallet._id,
        userId,

        transactions: {
          $elemMatch: {
            _id: transaction._id,
            paypalOrderId,
            status: "pending",
            paymentProvider: "PAYPAL"
          }
        }
      },
      {
        $inc: {
          balance: transaction.amount
        },

        $set: {
          "transactions.$.status": "success",

          "transactions.$.refundStatus":
            "completed",

          "transactions.$.transactionId":
            captureTransactionId,

          "transactions.$.refundedAt":
            new Date()
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

  if (!updatedWallet) {
    throw new Error(
      "Wallet transaction already processed"
    );
  }

  return updatedWallet;
};


/* =====================================
   CREDIT WALLET - REFUNDS
===================================== */


/* =====================================
   CREDIT WALLET - SAFE REFUNDS
===================================== */

const creditWallet = async (userId, transactionData) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const amount = Number(transactionData?.amount);
  const transactionId = transactionData?.transactionId;

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid wallet credit amount");
  }

  if (!transactionId) {
    throw new Error("Refund transaction ID is required");
  }

  const existingRefund = await Wallet.findOne({
    userId,
    "transactions.transactionId": transactionId,
  });

  if (existingRefund) {
    const transaction = existingRefund.transactions.find(
      (item) => item.transactionId === transactionId
    );

    // Treat an already completed refund as idempotent.
    if (
      transaction &&
      transaction.type === "credit" &&
      transaction.status === "success"
    ) {
      return existingRefund;
    }

    throw new Error("This refund transaction already exists");
  }

  let wallet = await Wallet.findOne({ userId });

  if (!wallet) {
    try {
      wallet = await Wallet.create({
        userId,
        balance: 0,
        transactions: [],
      });
    } catch (error) {
      if (error.code === 11000) {
        wallet = await Wallet.findOne({ userId });
      } else {
        throw error;
      }
    }
  }

  if (!wallet) {
    throw new Error("Unable to create customer wallet");
  }

  // Atomically prevent inserting the same transaction twice.
  const updatedWallet = await Wallet.findOneAndUpdate(
    {
      _id: wallet._id,
      userId,
      "transactions.transactionId": { $ne: transactionId },
    },
    {
      $inc: { balance: amount },
      $push: {
        transactions: {
          amount,
          type: "credit",
          status: "success",
          refundStatus: "completed",
          paymentProvider: transactionData.paymentProvider || "REFUND",
          orderId: transactionData.orderId || null,
          returnId: transactionData.returnId || null,
          transactionId,
          description:
            transactionData.description || "Refund added to wallet",
          refundedAt: new Date(),
        },
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedWallet) {
    // A concurrent request may have completed this refund.
    const latestWallet = await Wallet.findOne({ userId });

    const existingTransaction = latestWallet?.transactions.find(
      (item) => item.transactionId === transactionId
    );

    if (
      existingTransaction &&
      existingTransaction.type === "credit" &&
      existingTransaction.status === "success"
    ) {
      return latestWallet;
    }

    throw new Error("Refund was not credited; please check the transaction");
  }

  console.log("WALLET REFUND CREDITED", {
    userId,
    amount,
    newBalance: updatedWallet.balance,
    transactionId,
  });

  return updatedWallet;
};


/* =====================================
   DEBIT WALLET
===================================== */


/* =====================================
   DEBIT WALLET - SAFE ORDER PAYMENT
===================================== */

const debitWallet = async (userId, transactionData) => {
  const amount = Number(transactionData?.amount);
  const orderId = transactionData?.orderId;
  const transactionId = transactionData?.transactionId;

  if (!userId || !orderId || !transactionId) {
    throw new Error(
      "User ID, order ID and transaction ID are required"
    );
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid wallet payment amount");
  }

  // Prevent the same order payment from being debited twice.
  const existingDebit = await Wallet.findOne({
    userId,
    transactions: {
      $elemMatch: {
        transactionId,
        type: "debit",
        status: "success"
      }
    }
  });

  if (existingDebit) {
    throw new Error(
      "Wallet payment for this order has already been processed"
    );
  }

  // Atomically check balance and deduct money.
  const updatedWallet = await Wallet.findOneAndUpdate(
    {
      userId,
      balance: { $gte: amount },
      "transactions.transactionId": { $ne: transactionId }
    },
    {
      $inc: { balance: -amount },
      $push: {
        transactions: {
          ...transactionData,
          amount,
          orderId,
          transactionId,
          type: "debit",
          status: "success",
          debitedAt: new Date()
        }
      }
    },
    {
      new: true,
      runValidators: true
    }
  );

  if (!updatedWallet) {
    throw new Error(
      "Insufficient wallet balance or transaction already processed"
    );
  }

  return updatedWallet;
};


/* =====================================
   EXPORT
===================================== */

module.exports = {
  getWallet,
  createWallet,
  getOrCreateWallet,
  createPendingWalletTransaction,
  creditWalletAfterPayPal,
  creditWallet,
  debitWallet
};