const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true
    },

    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      default: null
    },

    paymentmethod: {
      type: String,
      enum: ["COD", "ONLINE", "WALLET"],
      required: true
    },

    orderstatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "out_for_delivery",
        "delivered",
        "partially_cancelled",
        "cancelled",
        "failed"
      ],
      default: "pending"
    },

    subtotal: {
      type: Number,
      required: true
    },

    discountamount: {
      type: Number,
      default: 0
    },

    total: {
      type: Number,
      required: true
    },

    coupondiscount: {
      type: Number,
      default: 0
    },

    paymentstatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending"
    },

    deliverycharge: {
      type: Number,
      default: 0
    },

    deliverydate: {
      type: Date,
      default: null
    },

    address: {
      name: {
        type: String,
        required: true
      },

      address: {
        type: String,
        required: true
      },

      pincode: {
        type: String,
        required: true
      }
    }
  },
  {
    timestamps: true
  }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;