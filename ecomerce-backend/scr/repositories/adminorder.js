const mongoose = require("mongoose");

const Order = require("../models/order");
const OrderItem = require("../models/orderitems");
const Payment = require("../models/payment");

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
  const allowedStatuses = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "out_for_delivery",
    "delivered",
  ];

  const nextStatus = String(status || "").toLowerCase();

  if (
    !mongoose.Types.ObjectId.isValid(orderId) ||
    !mongoose.Types.ObjectId.isValid(itemId)
  ) {
    throw new Error("Invalid order or item ID");
  }

  if (!allowedStatuses.includes(nextStatus)) {
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

      // Do not process unpaid online or wallet orders.

      if (
        ["ONLINE", "WALLET"].includes(method) &&
        paymentStatus !== "paid"
      ) {
        throw new Error(
          "Payment is not verified. This order cannot be processed or delivered."
        );
      }

      // Verify both the order and payment record.

      
      // Verify payment before processing online or wallet orders.

      if (["ONLINE", "WALLET"].includes(method)) {
        if (paymentStatus !== "paid") {
          throw new Error(
            "Payment is pending or unverified. This order cannot be processed."
          );
        }

        // ONLINE payments require a verified Payment document.
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

      const item = await OrderItem.findOne({
        _id: itemId,
        orderId: order._id,
      }).session(session);

      if (!item) {
        throw new Error("Order item not found");
      }

      const currentItemStatus = String(
        item.status || ""
      ).toLowerCase();

      if (
        ["cancelled", "returned"].includes(currentItemStatus)
      ) {
        throw new Error(
          "Cancelled or returned items cannot be processed."
        );
      }

      // Prevent moving an item backwards in the delivery workflow.

      const progression = [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "out_for_delivery",
        "delivered",
      ];

      const currentIndex = progression.indexOf(currentItemStatus);
      const nextIndex = progression.indexOf(nextStatus);

      if (
        currentIndex !== -1 &&
        nextIndex < currentIndex
      ) {
        throw new Error(
          "Order status cannot move backwards."
        );
      }

      item.status = nextStatus;

      const now = new Date();

      if (nextStatus === "confirmed") {
        item.confirmedAt = now;
      }

      if (nextStatus === "processing") {
        item.processingAt = now;
      }

      if (nextStatus === "shipped") {
        item.shippedAt = now;
      }

      if (nextStatus === "out_for_delivery") {
        item.outForDeliveryAt = now;
      }

      if (nextStatus === "delivered") {
        item.deliveredAt = now;
      }

      await item.save({ session });

      const items = await OrderItem.find({
        orderId: order._id,
      })
        .select("status")
        .session(session);

      const statuses = items.map((entry) =>
        String(entry.status || "").toLowerCase()
      );

      const allCancelled =
        statuses.length > 0 &&
        statuses.every((value) => value === "cancelled");

      const someCancelled = statuses.some(
        (value) => value === "cancelled"
      );

      let parentStatus = order.orderstatus;

      if (allCancelled) {
        parentStatus = "cancelled";
      } else if (someCancelled) {
        parentStatus = "partially_cancelled";
      } else if (
        statuses.length > 0 &&
        statuses.every((value) => value === nextStatus)
      ) {
        parentStatus = nextStatus;
      }

      order.orderstatus = parentStatus;

      await order.save({ session });

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
};