
const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null
    },

    returnId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },

    paymentProvider: {
      type: String,
      enum: ["PAYPAL", "REFUND", "WALLET"],
      default: null
    },

    paypalOrderId: {
      type: String,
      default: null
    },

    // PayPal payment amount in USD
    paypalAmount: {
      type: Number,
      default: null
    },

    paypalCurrency: {
      type: String,
      default: "USD"
    },

    // Conversion rate used when creating PayPal order
    conversionRate: {
      type: Number,
      default: null
    },

    refundStatus: {
      type: String,
      enum: [
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled"
      ],
      default: "pending"
    },

    transactionId: {
      type: String,
      default: null
    },

    senderName: {
      type: String,
      default: null,
      trim: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending"
    },

    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true
    },

    description: {
      type: String,
      default: "",
      trim: true
    },

    refundedAt: {
      type: Date,
      default: null
    },

    createdAt: {
      type: Date,
      default: Date.now
    },

    debitedAt: {
      type: Date,
      default: null
    }
  },
  {
    _id: true
  }
);

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      unique: true
    },

    balance: {
      type: Number,
      default: 0,
      min: 0
    },

    transactions: {
      type: [walletTransactionSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Wallet", walletSchema);