const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: false,
    },

    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    // ==========================================
    // WHO CAN USE THIS COUPON
    // ==========================================

    couponType: {
      type: String,
      enum: ["all", "firstOrder"],
      default: "all",
    },

    discounttype: {
      type: String,
      required: true,
      enum: ["percentage", "fixed"],
    },

    discountvalue: {
      type: Number,
      required: true,
      min: 0,
    },

    minorderAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    maxdiscountAmount: {
      type: Number,
      default: null,
      min: 0,
    },

    usespercustomer: {
      type: Number,
      required: true,
      min: 1,
    },

    totalusagelimit: {
      type: Number,
      required: true,
      min: 1,
    },

    valid_from: {
      type: Date,
      required: true,
    },

    valid_to: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Coupon", couponSchema);