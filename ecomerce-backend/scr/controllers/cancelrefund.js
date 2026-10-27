
const {
  prepareItemCancellationRefund,
} = require("../services/cancelrefund");

// ==========================================
// CANCEL ORDER ITEM AND PREPARE REFUND
// ==========================================

const cancelRefundController = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { reason } = req.body;

    // Use the authenticated customer's ID.
    // Adjust req.user._id only if your auth middleware uses another property.
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in to cancel this order",
      });
    }

    if (!reason || !String(reason).trim()) {
      return res.status(400).json({
        success: false,
        message: "Cancellation reason is required",
      });
    }

    const result = await prepareItemCancellationRefund({
      orderId,
      itemId,
      userId: String(userId),
      reason,
    });

    return res.status(200).json({
      success: true,
      message:
        result.refundAmount > 0
          ? "Cancellation validated. Refund will be credited to your wallet."
          : "Cancellation validated. No refund is due.",
      data: {
        orderId: result.orderId,
        itemId: result.itemId,
        paymentMethod: result.paymentMethod,
        eligibleForRefund: result.eligibleForRefund,
        refundAmount: result.refundAmount,
        refundDestination: result.refundDestination,
        reason: result.reason,
      },
    });
  } catch (error) {
    console.error("Cancel/refund controller error:", error);

    const clientErrors = [
      "Invalid order ID",
      "Invalid order item ID",
      "Order not found",
      "Order item not found",
      "Payment record not found",
      "Order ID, item ID, and user ID are required",
      "Cancellation reason is required",
      "This item has already been cancelled",
      "This item has already been returned or refunded",
      "This item cannot be cancelled at its current status",
      "Payment has not been completed successfully",
      "This item has already been refunded",
      "The actual amount paid for this item is unavailable",
    ];

    const statusCode = clientErrors.includes(error.message)
      ? 400
      : 500;

    return res.status(statusCode).json({
      success: false,
      message:
        statusCode === 400
          ? error.message
          : "Unable to process cancellation request",
    });
  }
};

module.exports = {
  cancelRefundController,
};
