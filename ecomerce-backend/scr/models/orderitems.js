const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },

    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVarient",
      required: true
    },

    quantity: {
      type: Number,
      required: true
    },

    price: {
      type: Number,
      required: true
    },

    // =================================================
    // ACTUAL AMOUNT PAID BY CUSTOMER
    // =================================================

    paidAmount: {
      type: Number,
      default: 0
    },

    // =================================================
    // CANCELLATION
    // =================================================

    cancelReason: {
      type: String,
      default: null
    },

    cancelledBy: {
      type: String,
      default: null
    },

    cancelledAt: {
      type: Date,
      default: null
    },

    // =================================================
    // ORDER ITEM STATUS
    // =================================================

  
status: {
  type: String,
  enum: [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "out_for_delivery",
    "delivered",
    "cancelled",
    "return_requested",
    "return_approved",
    "returned"
  ],
  default: "pending"
},


    // =================================================
    // RETURN
    // =================================================

    returnReason: {
      type: String,
      default: null
    },

    returnApprovedAt: {
      type: Date,
      default: null
    },

    returnReceivedAt: {
      type: Date,
      default: null
    },

    // =================================================
    // REFUND
    // =================================================

    refundStatus: {
      type: String,
      enum: [
        "NOT_APPLICABLE",
        "PENDING",
        "REFUNDED"
      ],
      default: "NOT_APPLICABLE"
    },

    refundAmount: {
      type: Number,
      default: 0
    },

    refundedAt: {
      type: Date,
      default: null
    },

    // =================================================
    // ORDER STATUS TIMESTAMPS
    // =================================================

    confirmedAt: {
      type: Date,
      default: null
    },

    processingAt: {
      type: Date,
      default: null
    },

    shippedAt: {
      type: Date,
      default: null
    },

    outForDeliveryAt: {
      type: Date,
      default: null
    },

    deliveredAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

const OrderItem = mongoose.model(
  "OrderItem",
  orderItemSchema
);

module.exports = OrderItem;