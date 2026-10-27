
const Order = require("../models/order");
const Payment = require("../models/payment");

// ==========================================
// GET ORDERS FOR SALES REPORT
// ==========================================

const getSalesReportOrders = async ({ start, end }) => {
  try {
    const filter = {};

    if (start || end) {
      filter.createdAt = {};

      if (start) {
        filter.createdAt.$gte = start;
      }

      if (end) {
        filter.createdAt.$lte = end;
      }
    }

    const orders = await Order.find(filter)
      .populate("userId", "FullName fullName name email")
      .sort({ createdAt: -1 })
      .lean();

    console.log("SALES REPORT ORDERS FOUND:", orders.length);

    // Fetch payment records for these orders.
    const orderIds = orders.map((order) => order._id);

    const payments = orderIds.length
      ? await Payment.find({
          orderId: { $in: orderIds },
        }).lean()
      : [];

    const paymentMap = new Map(
      payments.map((payment) => [
        String(payment.orderId),
        payment,
      ])
    );

    // Attach actual payment details without modifying the database.
    const ordersWithPayments = orders.map((order) => {
      const payment = paymentMap.get(String(order._id));

      return {
        ...order,
        paymentStatus:
          payment?.paymentStatus || order.paymentstatus,
        paymentMethod:
          payment?.paymentMethod || order.paymentmethod,
        transactionId: payment?.transactionId || null,
      };
    });

    console.log(
      "SALES REPORT PAYMENT STATUSES:",
      ordersWithPayments.map((order) => ({
        id: order._id,
        orderstatus: order.orderstatus,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
      }))
    );

    return ordersWithPayments;
  } catch (error) {
    console.error("SALES REPORT REPOSITORY ERROR:", error);
    throw error;
  }
};

module.exports = {
  getSalesReportOrders,
};
