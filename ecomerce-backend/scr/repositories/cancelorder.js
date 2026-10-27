const mongoose = require("mongoose");

const Order = require("../models/order");
const OrderItem = require("../models/orderitems");
const Payment = require("../models/payment");
const ProductVarient = require("../models/productvarient");

// ==========================================
// GET ORDER FOR REFUND
// ==========================================

const getOrderForRefund = async (orderId, userId = null) => {
  if (!mongoose.Types.ObjectId.isValid(String(orderId))) {
    throw new Error("Invalid order ID");
  }

  const query = { _id: orderId };

  if (userId) {
    query.userId = userId;
  }

  const order = await Order.findOne(query).lean();

  if (!order) {
    throw new Error("Order not found");
  }

  return order;
};

// ==========================================
// GET ORDER ITEM FOR REFUND
// ==========================================

const getOrderItemForRefund = async (orderId, itemId) => {
  if (
    !mongoose.Types.ObjectId.isValid(String(orderId)) ||
    !mongoose.Types.ObjectId.isValid(String(itemId))
  ) {
    throw new Error("Invalid order ID or order item ID");
  }

  const orderItem = await OrderItem.findOne({
    _id: itemId,
    orderId,
  }).lean();

  if (!orderItem) {
    throw new Error("Order item not found");
  }

  return orderItem;
};

// ==========================================
// GET PAYMENT DETAILS
// ==========================================

const getPaymentForRefund = async (orderId) => {
  if (!mongoose.Types.ObjectId.isValid(String(orderId))) {
    throw new Error("Invalid order ID");
  }

  const payment = await Payment.findOne({
    orderId,
  }).lean();

  if (!payment) {
    throw new Error("Payment record not found");
  }

  return payment;
};

// ==========================================
// GET ALL ITEMS IN AN ORDER
// ==========================================

const getOrderItemsForRefund = async (orderId) => {
  if (!mongoose.Types.ObjectId.isValid(String(orderId))) {
    throw new Error("Invalid order ID");
  }

  return await OrderItem.find({ orderId }).lean();
};

// ==========================================
// GET PRODUCT VARIANT
// ==========================================

const getVariantForRefund = async (variantId) => {
  if (!variantId) {
    return null;
  }

  if (!mongoose.Types.ObjectId.isValid(String(variantId))) {
    throw new Error("Invalid product variant ID");
  }

  return await ProductVarient.findById(variantId).lean();
};

// ==========================================
// CHECK REFUND ELIGIBILITY
// ==========================================

const checkRefundEligibility = ({ orderItem, payment }) => {
  if (!orderItem || !payment) {
    throw new Error("Order item or payment not found");
  }

  const itemStatus = String(
    orderItem.status || ""
  ).toLowerCase();

  if (itemStatus === "cancelled") {
    throw new Error("This item has already been cancelled");
  }

  if (["returned", "refunded"].includes(itemStatus)) {
    throw new Error("This item has already been returned or refunded");
  }

  const paymentMethod = String(
    payment.paymentMethod || ""
  ).toUpperCase();

  const paymentStatus = String(
    payment.paymentStatus || ""
  ).toLowerCase();

  // Only prepaid ONLINE and WALLET payments qualify.
  if (!["ONLINE", "WALLET"].includes(paymentMethod)) {
    return {
      eligible: false,
      refundAmount: 0,
      reason: "This payment method is not eligible for a prepaid refund",
    };
  }

  if (paymentStatus !== "paid") {
    throw new Error("Payment has not been completed successfully");
  }

  if (orderItem.refundStatus === "refunded") {
    throw new Error("This item has already been refunded");
  }

  // Use the saved amount paid for this item, including discounts.
  const refundAmount = Number(
    orderItem.paidAmount ?? orderItem.refundAmount
  );

  if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
    throw new Error(
      "The actual amount paid for this item is unavailable"
    );
  }

  return {
    eligible: true,
    refundAmount:
      Math.round((refundAmount + Number.EPSILON) * 100) / 100,
    paymentMethod,
  };
};

// ==========================================
// EXPORT REPOSITORY FUNCTIONS
// ==========================================

module.exports = {
  getOrderForRefund,
  getOrderItemForRefund,
  getPaymentForRefund,
  getOrderItemsForRefund,
  getVariantForRefund,
  checkRefundEligibility,
};