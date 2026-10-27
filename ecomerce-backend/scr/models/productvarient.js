const mongoose = require("mongoose");

const productVarientSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },

    variantName: {
      type: String,
      required: true
    },

    price: {
      type: Number,
      required: true
    },

    discount: {
      type: Number,
      default: 0
    },

    size: {
      type: String,
      required: true
    },

    color: {
      type: String,
      required: true
    },

    stock: {
      type: Number,
      required: true
    },

    productImages: [
      {
        imageUrl: {
          type: String,
          required: true
        }
      }
    ],

    skucode: {
      type: String,
      required: true,
      unique: true
    },

    shortDescription: {
      type: String,
      required: true
    },

    longDescription: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

const ProductVarient = mongoose.model(
  "ProductVarient",
  productVarientSchema
);

module.exports = ProductVarient;