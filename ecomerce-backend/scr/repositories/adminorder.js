const mongoose = require("mongoose");

const Order = require("../models/order");
const OrderItem = require("../models/orderitems");
const Payment = require("../models/payment");

// ==========================================
// SHARED CONSTANTS + HELPERS
// ==========================================

// Normal delivery flow, in order
const STATUS_FLOW = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
];

// Statuses in which a customer may still cancel
const CANCELLABLE_STATUSES = ["pending", "confirmed", "processing"];

// Which timestamp field belongs to which status
const TIMESTAMP_FIELD = {
  confirmed: "confirmedAt",
  processing: "processingAt",
  shipped: "shippedAt",
  out_for_delivery: "outForDeliveryAt",
  delivered: "deliveredAt",
};

// "Confirmed" / "CONFIRMED" / "Out for Delivery" -> "confirmed" / "out_for_delivery"
const normalizeStatus = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

// ------------------------------------------
// Recalculate Order.orderstatus from its items.
// Item status is the source of truth.
// Use this after ANY item status change
// (admin update, user cancel, return, ...).
// ------------------------------------------
const recalculateOrderStatus = async (orderId, session = null) => {
  const itemQuery = OrderItem.find({ orderId }).select("status");

  if (session) {
    itemQuery.session(session);
  }

  const items = await itemQuery;

  if (!items.length) {
    return null;
  }

  const statuses = items.map((item) => normalizeStatus(item.status));

  const cancelledCount = statuses.filter(
    (value) => value === "cancelled"
  ).length;

  let orderstatus;

  if (cancelledCount === statuses.length) {
    orderstatus = "cancelled";
  } else if (cancelledCount > 0) {
    orderstatus = "partially_cancelled";
  } else {
    // The order is only as far along as its slowest item.
    // return_* statuses count as delivered.
    const positions = statuses.map((value) => {
      const index = STATUS_FLOW.indexOf(value);
      return index === -1 ? STATUS_FLOW.length - 1 : index;
    });

    orderstatus = STATUS_FLOW[Math.min(...positions)];
  }

  await Order.findByIdAndUpdate(
    orderId,
    { orderstatus },
    session ? { session } : {}
  );

  return orderstatus;
};

// ==========================================
// GET ALL ADMIN ORDERS
// ==========================================

const getAllOrders = async () => {
  try {
    // Show COD orders normally.
    // Show ONLINE and WALLET orders only after payment is verified.
    // Exclude failed and cancelled orders from the normal admin list.
    const orders = await Order.find({
      $or: [
        {
          paymentmethod: "COD",
          orderstatus: {
            $nin: ["failed", "cancelled"],
          },
        },
        {
          paymentmethod: {
            $in: ["ONLINE", "WALLET"],
          },
          paymentstatus: "paid",
          orderstatus: {
            $nin: ["failed", "cancelled"],
          },
        },
      ],
    })
      .populate({
        path: "userId",
        model: "user",
        select:
          "FullName fullName name email MobileNumber",
      })
      .sort({
        createdAt: -1,
      })
      .lean();

    const ordersWithStatus = await Promise.all(
      orders.map(async (order) => {
        // GET ALL ITEMS OF THIS ORDER

        const items = await OrderItem.find({
          orderId: order._id,
        })
          .select("status")
          .lean();

        // GET ITEM STATUSES

        const statuses = items.map((item) =>
          String(item?.status || "").toLowerCase()
        );

        // CHECK CANCELLED ITEMS

        const allCancelled =
          items.length > 0 &&
          statuses.every(
            (status) => status === "cancelled"
          );

        const someCancelled = statuses.some(
          (status) => status === "cancelled"
        );

        const someActive = statuses.some(
          (status) =>
            status !== "cancelled" &&
            status !== "returned"
        );

        // DEFAULT STATUS

        let displayStatus = String(
          order?.orderstatus || "pending"
        ).toLowerCase();

        // ALL ITEMS CANCELLED

        if (allCancelled) {
          displayStatus = "cancelled";
        }

        // SOME ITEMS CANCELLED

        else if (someCancelled && someActive) {
          displayStatus = "partially_cancelled";
        }

        // RETURN ORDER

        return {
          ...order,
          displayStatus,
        };
      })
    );

    return ordersWithStatus;
  } catch (error) {
    console.error(
      "GET ALL ADMIN ORDERS REPOSITORY ERROR:",
      error
    );

    throw error;
  }
};

// ==========================================
// GET ADMIN ORDER DETAILS
// ==========================================

const getvieworder = async (orderId) => {
  try {
    const order = await Order.findById(orderId)
      .populate({
        path: "userId",
        model: "user",
        select:
          "FullName fullName name email MobileNumber createdAt",
      })
      .lean();

    if (!order) {
      throw new Error("Order not found");
    }

    // FETCH ORDER ITEMS

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

    // FETCH PAYMENT DETAILS

    const payment = await Payment.findOne({
      orderId: order._id,
    })
      .sort({ createdAt: -1 })
      .lean();

    return {
      order,
      items,
      payment,
    };
  } catch (error) {
    console.error(
      "GET ADMIN ORDER DETAILS REPOSITORY ERROR:",
      error
    );

    throw error;
  }
};

// ==========================================
// UPDATE ORDER ITEM STATUS
// ==========================================

const updateOrderItemStatus = async (
  orderId,
  itemId,
  status
) => {
  const nextStatus = normalizeStatus(status);

  if (
    !mongoose.Types.ObjectId.isValid(orderId) ||
    !mongoose.Types.ObjectId.isValid(itemId)
  ) {
    throw new Error("Invalid order or item ID");
  }

  if (!STATUS_FLOW.includes(nextStatus)) {
    throw new Error("Invalid order status");
  }

  const session = await mongoose.startSession();

  try {
    let updatedItem;

    await session.withTransaction(async () => {
      const order = await Order.findById(orderId).session(session);

      if (!order) {
        throw new Error("Order not found");
      }

      const method = String(
        order.paymentmethod || ""
      ).toUpperCase();

      const paymentStatus = String(
        order.paymentstatus || ""
      ).toLowerCase();

      // ------------------------------------------
      // PAYMENT VERIFICATION (ONLINE / WALLET)
      // ------------------------------------------

      if (["ONLINE", "WALLET"].includes(method)) {
        if (paymentStatus !== "paid") {
          throw new Error(
            "Payment is pending or unverified. This order cannot be processed."
          );
        }

        // ONLINE payments also need a verified Payment document.
        // WALLET payments are verified through the Order document.
        if (method === "ONLINE") {
          const payment = await Payment.findOne({
            orderId: order._id,
          })
            .sort({ createdAt: -1 })
            .session(session);

          if (
            !payment ||
            String(payment.paymentStatus || "").toLowerCase() !== "paid"
          ) {
            throw new Error(
              "Online payment is pending or unverified. This order cannot be processed."
            );
          }
        }
      }

      if (
        ["cancelled", "failed"].includes(
          String(order.orderstatus || "").toLowerCase()
        )
      ) {
        throw new Error(
          "Cancelled or failed orders cannot be processed."
        );
      }

      // ------------------------------------------
      // FIND THE ITEM
      // ------------------------------------------

      const item = await OrderItem.findOne({
        _id: itemId,
        orderId: order._id,
      }).session(session);

      if (!item) {
        throw new Error("Order item not found");
      }

      const currentItemStatus = normalizeStatus(item.status);

      if (currentItemStatus === "cancelled") {
        throw new Error("Cancelled items cannot be processed.");
      }

      // return_requested / return_approved / returned are not part of
      // the delivery flow, so they cannot be changed from here.
      const currentIndex = STATUS_FLOW.indexOf(currentItemStatus);
      const nextIndex = STATUS_FLOW.indexOf(nextStatus);

      if (currentIndex === -1) {
        throw new Error(
          "Items in a return process cannot be updated here."
        );
      }

      if (nextIndex <= currentIndex) {
        throw new Error(
          nextIndex === currentIndex
            ? "Item is already in this status."
            : "Order status cannot move backwards."
        );
      }

      // ------------------------------------------
      // UPDATE ITEM + TIMESTAMPS
      // (also fills timestamps of any skipped steps,
      //  so the tracking page can show a date for each)
      // ------------------------------------------

      const now = new Date();

      for (let i = currentIndex + 1; i <= nextIndex; i++) {
        const field = TIMESTAMP_FIELD[STATUS_FLOW[i]];

        if (field && !item[field]) {
          item[field] = now;
        }
      }

      item.status = nextStatus;

      await item.save({ session });

      // ------------------------------------------
      // UPDATE ORDER STATUS FROM ALL ITEMS
      // ------------------------------------------

      await recalculateOrderStatus(order._id, session);

      updatedItem = item;
    });

    return updatedItem;
  } catch (error) {
    console.error(
      "UPDATE ORDER ITEM STATUS ERROR:",
      error
    );

    throw error;
  } finally {
    await session.endSession();
  }
};

// ==========================================
// UPDATE DELIVERY DATE
// ==========================================

const updateDeliveryDate = async (
  orderId,
  deliverydate
) => {
  try {
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        deliverydate: deliverydate,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!order) {
      throw new Error("Order not found");
    }

    return order;
  } catch (error) {
    console.error(
      "UPDATE DELIVERY DATE REPOSITORY ERROR:",
      error
    );

    throw error;
  }
};

module.exports = {
  getAllOrders,
  getvieworder,
  updateOrderItemStatus,
  updateDeliveryDate,

  // shared with the user-side cancel / return code
  recalculateOrderStatus,
  STATUS_FLOW,
  CANCELLABLE_STATUSES,
  normalizeStatus,
};