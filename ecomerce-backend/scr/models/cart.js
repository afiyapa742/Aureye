const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    // Store the actual selling price including product offer
    price: {
      type: Number,
      min: 0,
    },

 quantity: {
  type: Number,
  required: true,
  min: 1,
  max: [3, "You can buy a maximum of 3 per product"],
},
  },
  {
    _id: false,
  }
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    cartitems: {
      type: [cartItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Cart", cartSchema);