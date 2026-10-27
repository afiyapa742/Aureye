
const mongoose = require("mongoose");

const {
  getOrderForRefund,
  getOrderItemForRefund,
  getPaymentForRefund,
  getOrderItemsForRefund,
  checkRefundEligibility,
} = require("../repositories/cancelorder");

// ==========================================
// PREPARE ITEM CANCELLATION AND REFUND
// ==========================================

const prepareItemCancellationRefund = async ({
  orderId,
  itemId,
  userId,
  reason,
}) => {
  if (!orderId || !itemId || !userId) {
    throw new Error("Order ID, item ID, and user ID are required");
  }

  if (!mongoose.Types.ObjectId.isValid(String(orderId))) {
    throw new Error("Invalid order ID");
  }

  if (!mongoose.Types.ObjectId.isValid(String(itemId))) {
    throw new Error("Invalid order item ID");
  }

  if (!String(reason || "").trim()) {
    throw new Error("Cancellation reason is required");
  }

  // Ensure the order belongs to the requesting customer.
  const order = await getOrderForRefund(orderId, userId);

  const orderItem = await getOrderItemForRefund(orderId, itemId);

  // Do not allow cancellation after shipment or delivery.
  const itemStatus = String(orderItem.status || "").toLowerCase();

  if (
    ["shipped", "delivered", "completed", "returned", "refunded"].includes(
      itemStatus
    )
  ) {
    throw new Error(
      "This item cannot be cancelled at its current status"
    );
  }

  const payment = await getPaymentForRefund(orderId);

  const eligibility = checkRefundEligibility({
    orderItem,
    payment,
  });

  const normalizedPaymentMethod = String(
    payment.paymentMethod || ""
  ).toUpperCase();

  const normalizedPaymentStatus = String(
    payment.paymentStatus || ""
  ).toLowerCase();

  // COD is unpaid, so no refund should be created.
  const isPaidOnlineOrWallet =
    ["ONLINE", "WALLET"].includes(normalizedPaymentMethod) &&
    normalizedPaymentStatus === "paid";

  const refundAmount = isPaidOnlineOrWallet
    ? eligibility.refundAmount
    : 0;

  // Read all order items to determine whether this is a full cancellation.
  const orderItems = await getOrderItemsForRefund(orderId);

  const allOtherItemsCancelled = orderItems
    .filter((item) => String(item._id) !== String(itemId))
    .every(
      (item) =>
        String(item.status || "").toLowerCase() === "cancelled"
    );

  return {
    orderId: String(order._id),
    itemId: String(orderItem._id),
    userId: String(userId),
    reason: String(reason).trim(),
    paymentMethod: normalizedPaymentMethod,
    paymentStatus: normalizedPaymentStatus,
    eligibleForRefund: isPaidOnlineOrWallet && eligibility.eligible,
    refundAmount,
    refundDestination: refundAmount > 0 ? "WALLET" : null,
    isLastActiveItem: allOtherItemsCancelled,
    order,
    orderItem,
    payment,
  };
};

// ==========================================
// EXPORT SERVICE
// ==========================================

module.exports = {
  prepareItemCancellationRefund,
};
