
const {
  getSalesReportOrders,
} = require("../repositories/salesreport");

// ==========================================
// GET SALES REPORT
// ==========================================

const getSalesReport = async ({
  period = "daily",
  startDate,
  endDate,
} = {}) => {
  const now = new Date();

  let start = null;
  let end = null;

  // DAILY REPORT
  if (period === "daily") {
    start = new Date(now);
    start.setHours(0, 0, 0, 0);

    end = new Date(now);
    end.setHours(23, 59, 59, 999);
  }

  // WEEKLY REPORT: MONDAY TO SUNDAY
  else if (period === "weekly") {
    start = new Date(now);
    start.setHours(0, 0, 0, 0);

    const day = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - day);

    end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  }

  // YEARLY REPORT
  else if (period === "yearly") {
    start = new Date(now.getFullYear(), 0, 1);
    end = new Date(
      now.getFullYear(),
      11,
      31,
      23,
      59,
      59,
      999
    );
  }

  // CUSTOM DATE REPORT
  else if (period === "custom") {
    const isValidDate = (value) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) {
        return false;
      }

      const date = new Date(`${value}T00:00:00`);

      return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().startsWith(value)
      );
    };

    if (
      (startDate && !isValidDate(startDate)) ||
      (endDate && !isValidDate(endDate))
    ) {
      throw new Error("Invalid date format. Use YYYY-MM-DD");
    }

    if (!startDate && !endDate) {
      throw new Error("Please select a date range");
    }

    start = startDate
      ? new Date(`${startDate}T00:00:00`)
      : null;

    end = endDate
      ? new Date(`${endDate}T23:59:59.999`)
      : null;

    if (start && end && start > end) {
      throw new Error("Start date cannot be after end date");
    }
  } else {
    throw new Error("Invalid sales report period");
  }

  const orders = await getSalesReportOrders({ start, end });

  console.log("SALES REPORT: fetched orders =", orders.length);

  // ==========================================
  // FILTER COMPLETED ORDERS
  // ==========================================
const completedOrders = orders.filter((order) => {
  const status = String(
    order.displayStatus ||
      order.orderstatus ||
      order.status ||
      ""
  )
    .toLowerCase()
    .replace(/_/g, " ")
    .trim();

const paymentStatus = String(
  order.paymentstatus ||
    order.paymentStatus ||
    ""
)
  .toLowerCase()
  .trim();

  const paymentMethod = String(
    order.paymentmethod ||
      order.paymentMethod ||
      ""
  )
    .toLowerCase()
    .trim();

  // Exclude cancelled and returned orders.
  if (
    ["cancelled", "returned", "refunded"].includes(status) ||
    ["failed", "refunded", "cancelled"].includes(paymentStatus)
  ) {
    return false;
  }

  // COD counts only after delivery.
  if (paymentMethod === "cod") {
    return ["delivered", "completed"].includes(status);
  }

  // Online/wallet orders count only after successful payment.
  return paymentStatus === "paid";
});
  // ==========================================
  // NORMALIZE SALES VALUES
  // ==========================================

  const reportOrders = completedOrders.map((order) => {
    const total = Math.max(
      0,
      Number(
        order.total ??
          order.totalAmount ??
          order.grandTotal ??
          order.finalAmount ??
          order.payableAmount ??
          0
      )
    );

    const discount = Math.max(
      0,
      Number(
        order.discountamount ??
          order.discountAmount ??
          order.totalDiscount ??
          order.discount ??
          0
      )
    );

    const couponDiscount = Math.max(
      0,
      Number(
        order.coupondiscount ??
          order.couponDiscount ??
          order.couponDiscountAmount ??
          0
      )
    );

    return {
      ...order,
      total,
      discountamount: discount,
      coupondiscount: couponDiscount,
    };
  });

  // ==========================================
  // CALCULATE SUMMARY
  // ==========================================

  const summary = reportOrders.reduce(
    (result, order) => {
      result.orderCount += 1;
      result.netSales += order.total;
      result.discounts += order.discountamount;
      result.couponDiscounts += order.coupondiscount;

      return result;
    },
    {
      orderCount: 0,
      netSales: 0,
      discounts: 0,
      couponDiscounts: 0,
      grossSales: 0,
    }
  );

  summary.grossSales =
    summary.netSales + summary.discounts;

  Object.keys(summary).forEach((key) => {
    if (key !== "orderCount") {
      summary[key] = Number(summary[key].toFixed(2));
    }
  });

  console.log("SALES REPORT SUMMARY:", summary);

  return {
    period,
    dateRange: { start, end },
    summary,
    orders: reportOrders,
  };
};

module.exports = {
  getSalesReport,
};
