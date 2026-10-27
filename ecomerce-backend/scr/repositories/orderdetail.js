const Order = require("../models/order");
const OrderItem = require("../models/orderitems");
const ProductVarient = require("../models/productvarient");
const Payment = require("../models/payment");
const { creditWallet } = require("./wallet");
const RETURN_WINDOW_DAYS = 9;
const RETURN_WINDOW_MS = RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000;
// ==========================================
// GET MY ORDERS
// ==========================================


// ==========================================
// GET MY ORDERS
// ==========================================

const getorder = async (userId) => {
  try {
    const orders = await Order.find({
      userId,

      // COD orders can appear before payment.
      // ONLINE and WALLET orders appear only after payment.
      $or: [
        {
          paymentmethod: "COD",
          orderstatus: {
            $nin: ["failed", "pending"]
          }
        },
        {
          paymentmethod: {
            $in: ["ONLINE", "WALLET"]
          },
          paymentstatus: "paid",
          orderstatus: {
            $nin: ["failed", "pending"]
          }
        }
      ]
    })
      .sort({ createdAt: -1 })
      .lean();

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await OrderItem.find({
          orderId: order._id
        })
          .populate({
            path: "productId",
            model: "Product",
            select: "productName"
          })
          .populate({
            path: "variantId",
            model: "ProductVarient",
            select:
              "variantName price size color stock productImages skucode"
          })
          .lean();

        return {
          ...order,
          items
        };
      })
    );

    return ordersWithItems;
  } catch (error) {
    console.error(
      "GET MY ORDER REPOSITORY ERROR:",
      error
    );

    throw error;
  }
};


// ==========================================
// CANCEL ORDER ITEM
// ==========================================


const cancelorder = async (itemId, reason) => {
  try {
    if (!itemId) {
      throw new Error("Order item ID is required");
    }

    const orderItem = await OrderItem.findById(itemId);

    if (!orderItem) {
      throw new Error("Order item not found");
    }

    if (orderItem.status === "cancelled") {
      throw new Error("This item is already cancelled");
    }

    const cancellableStatuses = [
      "pending",
      "confirmed",
      "processing",
    ];

    if (
      !cancellableStatuses.includes(
        String(orderItem.status || "").toLowerCase()
      )
    ) {
      throw new Error(
        "This order item cannot be cancelled after shipping"
      );
    }

    const order = await Order.findById(orderItem.orderId);

    if (!order) {
      throw new Error("Order not found");
    }

    const paymentMethod = String(
      order.paymentmethod || ""
    ).toUpperCase();

    const payment = await Payment.findOne({
      orderId: order._id,
      paymentStatus: "paid",
    });

    // Only credit the wallet for WALLET payments.
    // PayPal refunds require the actual capture ID and PayPal refund API.
    const orderIsPaid =
  String(order.paymentstatus || "").toLowerCase() === "paid" ||
  String(payment?.paymentStatus || "").toLowerCase() === "paid";

if (
  ["WALLET", "ONLINE"].includes(paymentMethod) &&
  orderIsPaid
) {
  if (orderItem.refundStatus === "REFUNDED") {
    throw new Error("This item has already been refunded");
  }

  const refundAmount = Number(
    orderItem.paidAmount ??
    orderItem.refundAmount ??
    0
  );

  if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
    throw new Error(
      "Invalid refund amount. Check the order item's paidAmount."
    );
  }

  await creditWallet(order.userId, {
    amount: refundAmount,
    type: "credit",
    paymentProvider: "REFUND",
    description: `Cancellation refund for ${paymentMethod} order item ${orderItem._id}`,
    orderId: order._id,
    transactionId: `CANCEL-REFUND-${orderItem._id}`,
  });

  orderItem.refundAmount = refundAmount;
  orderItem.refundStatus = "REFUNDED";
  orderItem.refundedAt = new Date();
}

    // Restore stock only after validating the item.
    if (orderItem.variantId) {
      const variant = await ProductVarient.findById(
        orderItem.variantId
      );

      if (!variant) {
        throw new Error("Product variant not found");
      }

      variant.stock =
        Number(variant.stock || 0) +
        Number(orderItem.quantity || 0);

      await variant.save();
    }

    orderItem.status = "cancelled";
    orderItem.cancelReason = reason?.trim() || null;
    orderItem.cancelledBy = "user";
    orderItem.cancelledAt = new Date();

    await orderItem.save();

    const remainingItems = await OrderItem.find({
      orderId: orderItem.orderId,
    }).select("status");

    const allCancelled =
      remainingItems.length > 0 &&
      remainingItems.every(
        (item) =>
          String(item.status || "").toLowerCase() === "cancelled"
      );

    const someCancelled = remainingItems.some(
      (item) =>
        String(item.status || "").toLowerCase() === "cancelled"
    );

    if (allCancelled) {
      order.orderstatus = "cancelled";
    } else if (someCancelled) {
      order.orderstatus = "partially_cancelled";
    }

    await order.save();

    return {
      success: true,
      message:
        paymentMethod === "ONLINE"
          ? "Item cancelled. PayPal refund integration is still required."
          : "Item cancelled successfully",
      data: orderItem,
    };
  } catch (error) {
    console.error("CANCEL ORDER ITEM ERROR:", error);
    throw error;
  }
};



// ==========================================
// RETURN ORDER ITEM / BULK RETURN
// ==========================================

const returnorder = async (itemIds, reason) => {
  try {
    // --------------------------------------
    // CHECK RETURN REASON
    // --------------------------------------

    const trimmedReason = reason?.trim();

    if (!trimmedReason) {
      throw new Error("Return reason is required");
    }

    // --------------------------------------
    // NORMALIZE ITEM IDS
    // --------------------------------------

    let ids = [];

    if (Array.isArray(itemIds)) {
      ids = itemIds;
    } else if (itemIds) {
      ids = [itemIds];
    }

    ids = ids.filter(Boolean).map((id) => String(id));

    if (ids.length === 0) {
      throw new Error("At least one order item is required");
    }

    // --------------------------------------
    // FIND SELECTED ITEMS
    // --------------------------------------

    const orderItems = await OrderItem.find({
      _id: { $in: ids },
    });

    if (orderItems.length !== ids.length) {
      throw new Error("One or more order items were not found");
    }

    // --------------------------------------
    // CHECK SAME ORDER
    // --------------------------------------

    const orderIds = [
      ...new Set(orderItems.map((item) => String(item.orderId))),
    ];

    if (orderIds.length !== 1) {
      throw new Error(
        "Items from different orders cannot be returned together"
      );
    }

    // Order is loaded so we can fall back to order.deliveredAt
    const order = await Order.findById(orderIds[0]).lean();

    if (!order) {
      throw new Error("Order not found");
    }

    // --------------------------------------
    // CHECK STATUS + 9 DAY WINDOW
    // (each failure now has its own message)
    // --------------------------------------

    const nowMs = Date.now();

    for (const item of orderItems) {
      const currentStatus = String(item.status || "").toLowerCase();

      // 0. Already requested / in the return process
      const returnStatuses = [
        "return_requested",
        "return_approved",
        "returned",
      ];

      if (returnStatuses.includes(currentStatus)) {
        throw new Error(
          "A return request has already been submitted for this item"
        );
      }

      // 1. Must be delivered
      if (currentStatus !== "delivered") {
        throw new Error(
          `Only delivered items can be returned (current status: ${currentStatus || "unknown"})`
        );
      }

      // 2. Delivered date must exist (item first, then order)
      const deliveredDate = item.deliveredAt || order.deliveredAt;

      if (!deliveredDate) {
        console.error(
          "RETURN: deliveredAt missing for item",
          String(item._id),
          "- check the code that marks items as delivered"
        );

        throw new Error(
          "Delivery date is missing for this item. Please contact support."
        );
      }

      const deliveredMs = new Date(deliveredDate).getTime();

      if (!Number.isFinite(deliveredMs)) {
        throw new Error(
          "Delivery date is invalid for this item. Please contact support."
        );
      }

      // 3. Window check
      if (nowMs > deliveredMs + RETURN_WINDOW_MS) {
        throw new Error(
          `Return request is available only within ${RETURN_WINDOW_DAYS} days of delivery`
        );
      }
    }

    // --------------------------------------
    // UPDATE RETURN STATUS
    // --------------------------------------

    const updatedItems = [];

    for (const item of orderItems) {
      item.status = "return_requested";
      item.returnReason = trimmedReason;

      await item.save();

      updatedItems.push(item);
    }

    return updatedItems;

  } catch (error) {
    console.error("RETURN ORDER REPOSITORY ERROR:", error);

    throw error;
  }
};
 
 
// ==========================================
// GET INDIVIDUAL INVOICE
// ==========================================


const invoiceget = async (orderId, itemId = null) => {
  const order = await Order.findById(orderId)
    .populate("address")
    .lean();

  if (!order) {
    throw new Error("Order not found");
  }

  let itemsQuery = OrderItem.find({ orderId });

  if (itemId) {
    itemsQuery = OrderItem.find({
      _id: itemId,
      orderId,
    });
  }

  const items = await itemsQuery
    .populate("productId")
    .populate("variantId")
    .lean();

  if (!items.length) {
    throw new Error("No order items found");
  }

  return {
    order,
    items,
    // Retain compatibility with the existing individual invoice.
    item: itemId ? items[0] : null,
  };
};

// ==========================================
// EXPORT
// ==========================================

module.exports = {
  getorder,
  cancelorder,
  returnorder,
  invoiceget,
};