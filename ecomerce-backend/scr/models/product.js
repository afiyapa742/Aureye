const mongoose = require("mongoose");

const productschema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },

    productName: {
      type: String,
      required: true
    },

    meterialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meterial",
      required: true
    },

    manufacture: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      required: true
    }
  },

  {
    timestamps: true
  }
);

const Product = mongoose.model("Product", productschema);

module.exports = Product;