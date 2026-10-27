const {
  getorder,
  cancelorder,
  invoiceget,
  returnorder
} = require("../repositories/orderdetail");

// GET MY ORDERS
const Getmyorder = async (userId) => {
  const order = await getorder(userId);

  if (!order || order.length === 0) {
    throw new Error("Order not found");
  }

  return order;
};

// CANCEL ORDER ITEM
const CancelOrder = async (itemId, reason) => {
  const cancelledItem = await cancelorder(
    itemId,
    reason
  );

  if (!cancelledItem) {
    throw new Error("Order item not found");
  }

  return cancelledItem;
};

// GET INDIVIDUAL INVOICE
const GetInvoice = async (orderId, itemId) => {
  const invoice = await invoiceget(
    orderId,
    itemId
  );

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  return invoice;
};

// RETURN ORDER
const ReturnOrder = async (itemIds, reason) => {
  try {
    if (!reason?.trim()) {
      throw new Error("Return reason is required");
    }

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      throw new Error(
        "At least one order item is required"
      );
    }

    const result = await returnorder(
      itemIds,
      reason.trim()
    );

    return result;
  } catch (error) {
    console.error(
      "RETURN ORDER SERVICE ERROR:",
      error
    );

    throw error;
  }
};

module.exports = {
  Getmyorder,
  CancelOrder,
  GetInvoice,
  ReturnOrder
};