const Order = require("../models/order");
const OrderItem = require("../models/orderitems");
const Payment = require("../models/payment");
const mongoose = require("mongoose");


// ==========================================
// CREATE ORDER
// ==========================================

const createOrder = async (orderData) => {
  return await Order.create(orderData);
};


// ==========================================
// CREATE ORDER ITEM
// ==========================================

const createOrderItem = async (orderItemData) => {
  return await OrderItem.create(orderItemData);
};


// ==========================================
// CREATE PAYMENT
// ==========================================

const createPayment = async (paymentData) => {
  return await Payment.create(paymentData);
};


// ==========================================
// GET ORDER BY ID
// ==========================================

const getOrderById = async (orderId) => {
  return await Order.findById(orderId);
};


// ==========================================
// GET ORDER ITEMS
// ==========================================

const getOrderItems = async (orderId) => {
  return await OrderItem.find({
    orderId: orderId
  });
};


// ==========================================
// GET PAYMENT BY ORDER ID
// ==========================================

const getPaymentByOrderId = async (orderId) => {
  return await Payment.findOne({
    orderId: orderId
  });
};


// ==========================================
// UPDATE ORDER STATUS
// ==========================================

const updateOrderStatus = async (orderId, status) => {
  return await Order.findByIdAndUpdate(
    orderId,
    {
      orderstatus: status
    },
    {
      returnDocument: "after"
    }
  );
};


// ==========================================
// UPDATE PAYMENT STATUS
// ==========================================

const updatePaymentStatus = async (
  orderId,
  paymentStatus
) => {

  return await Payment.findOneAndUpdate(
    {
      orderId: orderId
    },
    {
      paymentStatus: paymentStatus
    },
    {
      returnDocument: "after"
    }
  );
};


// ==========================================
// EXPORT
// ==========================================

module.exports = {
  createOrder,
  createOrderItem,
  createPayment,
  getOrderById,
  getOrderItems,
  getPaymentByOrderId,
  updateOrderStatus,
  updatePaymentStatus
};