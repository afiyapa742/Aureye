const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true
    },

    paymentMethod: {
      type: String,
      enum: ["COD", "ONLINE", "WALLET"],
      required: true
    },

    transactionId: {
      type: String,
      default: null
    },

    amount: {
      type: Number,
      required: true
    },

    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "paid",
        "failed",
        "refunded"
      ],
      default: "pending"
    },

    paidAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

const Payment = mongoose.model(
  "Payment",
  paymentSchema
);

module.exports = Payment;