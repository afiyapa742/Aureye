const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: false,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: false,
    },

    offerName: {
      type: String,
      required: true,
      trim: true,
    },

    offerType: {
      type: String,
      enum: ["common","product", "category"],
      required: true,
    },

    discounttype: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },

    discountvalue: {
      type: Number,
      required: true,
      min: 0,
    },

    valid_from: {
      type: Date,
      required: true,
    },

    valid_to: {
      type: Date,
      required: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    offer_status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Offer", offerSchema);