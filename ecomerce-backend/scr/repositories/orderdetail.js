const mongoose = require("mongoose");

const Order = require("../models/order");
const OrderItem = require("../models/orderitems");
const ProductVarient = require("../models/productvarient");
const Payment = require("../models/payment");
const { creditWallet } = require("./wallet");

// Shared with the admin status code (repositories/adminorder.js)
const {
  recalculateOrderStatus,
  CANCELLABLE_STATUSES,
  normalizeStatus,
} = require("./adminorder");

const RETURN_WINDOW_DAYS = 9;
const RETURN_WINDOW_MS = RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000;

// ==========================================
// GET MY ORDERS
// ==========================================

const getorder = async (userId) => {
  try {
    const orders = await Order.find({
      userId,
    })
      .sort({ createdAt: -1 })
      .lean();

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await OrderItem.find({
          orderId: order._id,
        })
          .populate({
            path: "productId",
            model: "Product",
            select: "productName",
          })
          .populate({
            path: "variantId",
            model: "ProductVarient",
            select:
              "variantName price size color stock productImages skucode",
          })
          .lean();

        return {
          ...order,
          items,
        };
      })
    );

    return ordersWithItems;
  } catch (error) {
    console.error("GET MY ORDER REPOSITORY ERROR:", error);
    throw error;
  }
};

// ==========================================
// CANCEL ORDER ITEM
// ==========================================

const cancelorder = async (itemId, reason, userId) => {
  try {
    if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
      throw new Error("Valid order item ID is required");
    }

    if (!userId) {
      throw new Error("User ID is required");
    }

    // --------------------------------------
    // LOAD + VALIDATE (before changing anything)
    // --------------------------------------

    const existingItem = await OrderItem.findById(itemId);

    if (!existingItem) {
      throw new Error("Order item not found");
    }

    const order = await Order.findById(existingItem.orderId);

    if (!order) {
      throw new Error("Order not found");
    }

    // The item must belong to the logged-in user
    if (String(order.userId) !== String(userId)) {
      throw new Error("You are not allowed to cancel this item");
    }

    const currentStatus = normalizeStatus(existingItem.status);

    if (currentStatus === "cancelled") {
      throw new Error("This item is already cancelled");
    }

    if (!CANCELLABLE_STATUSES.includes(currentStatus)) {
      throw new Error(
        "This order item cannot be cancelled after shipping"
      );
    }

    // Variant must exist so the stock can be restored
    if (existingItem.variantId) {
      const variantExists = await ProductVarient.exists({
        _id: existingItem.variantId,
      });

      if (!variantExists) {
        throw new Error("Product variant not found");
      }
    }

    // Work out the refund before cancelling
    const paymentMethod = String(
      order.paymentmethod || ""
    ).toUpperCase();

    const payment = await Payment.findOne({
      orderId: order._id,
      paymentStatus: "paid",
    });

    const orderIsPaid =
      String(order.paymentstatus || "").toLowerCase() === "paid" ||
      String(payment?.paymentStatus || "").toLowerCase() === "paid";

    const needsRefund =
      ["WALLET", "ONLINE"].includes(paymentMethod) && orderIsPaid;

    let refundAmount = 0;

    if (needsRefund) {
      if (existingItem.refundStatus === "REFUNDED") {
        throw new Error("This item has already been refunded");
      }

      refundAmount = Number(
        existingItem.paidAmount ?? existingItem.refundAmount ?? 0
      );

      if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
        throw new Error(
          "Invalid refund amount. Check the order item's paidAmount."
        );
      }
    }

    // --------------------------------------
    // CLAIM THE CANCELLATION (atomic)
    // Only ONE request can move the item from a
    // cancellable status to "cancelled". A second or
    // double-click request gets null here and stops.
    // --------------------------------------

    const orderItem = await OrderItem.findOneAndUpdate(
      {
        _id: itemId,
        status: { $in: CANCELLABLE_STATUSES },
      },
      {
        $set: {
          status: "cancelled",
          cancelReason: reason?.trim() || null,
          cancelledBy: "user",
          cancelledAt: new Date(),
        },
      },
      { new: true }
    );

    if (!orderItem) {
      throw new Error("This item is already cancelled");
    }

    // --------------------------------------
    // REFUND TO WALLET
    // If the refund fails, undo the cancellation
    // so the customer can try again.
    // --------------------------------------

    if (needsRefund) {
      try {
        await creditWallet(order.userId, {
          amount: refundAmount,
          type: "credit",
          paymentProvider: "REFUND",
          description: `Cancellation refund for ${paymentMethod} order item ${orderItem._id}`,
          orderId: order._id,
          transactionId: `CANCEL-REFUND-${orderItem._id}`,
        });
      } catch (refundError) {
        await OrderItem.updateOne(
          { _id: itemId },
          {
            $set: {
              status: existingItem.status,
              cancelReason: null,
              cancelledBy: null,
              cancelledAt: null,
            },
          }
        );

        throw refundError;
      }

      orderItem.refundAmount = refundAmount;
      orderItem.refundStatus = "REFUNDED";
      orderItem.refundedAt = new Date();

      await orderItem.save();
    }

    // --------------------------------------
    // RESTORE STOCK
    // --------------------------------------

    if (orderItem.variantId) {
      await ProductVarient.findByIdAndUpdate(orderItem.variantId, {
        $inc: { stock: Number(orderItem.quantity || 0) },
      });
    }

    // --------------------------------------
    // UPDATE ORDER STATUS FROM ALL ITEMS
    // --------------------------------------

    await recalculateOrderStatus(order._id);

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