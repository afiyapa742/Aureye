const Payment = require("../models/payment");

const createPayment = async (paymentData) => {
  try {
    const payment = await Payment.create(paymentData);

    return payment;
  } catch (error) {
    console.error(
      "CREATE PAYMENT REPOSITORY ERROR:",
      error
    );

    throw error;
  }
};

const findPaymentByTransactionId = async (
  transactionId
) => {
  try {
    return await Payment.findOne({
      transactionId
    });
  } catch (error) {
    console.error(
      "FIND PAYMENT REPOSITORY ERROR:",
      error
    );

    throw error;
  }
};

const getPaymentByOrderId = async (orderId) => {
  try {
    return await Payment.findOne({
      orderId
    });
  } catch (error) {
    console.error(
      "GET PAYMENT BY ORDER ID ERROR:",
      error
    );

    throw error;
  }
};

const updatePaymentStatus = async (
  paymentId,
  updateData
) => {
  try {
    return await Payment.findByIdAndUpdate(
      paymentId,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );
  } catch (error) {
    console.error(
      "UPDATE PAYMENT REPOSITORY ERROR:",
      error
    );

    throw error;
  }
};

module.exports = {
  createPayment,
  findPaymentByTransactionId,
  getPaymentByOrderId,
  updatePaymentStatus
};