import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../Api/axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import "./SalesReport.css";

// ==========================================
// HELPERS
// ==========================================

const getLocalDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const getStatus = (order) =>
  String(
    order?.displayStatus ||
      order?.orderstatus ||
      order?.orderStatus ||
      order?.status ||
      ""
  )
    .toLowerCase()
    .replace(/_/g, " ")
    .trim();

const getPaymentStatus = (order) =>
  String(
    order?.paymentStatus ||
      order?.paymentstatus ||
      order?.payment?.paymentStatus ||
      ""
  )
    .toLowerCase()
    .trim();

const getPaymentMethod = (order) =>
  String(
    order?.paymentMethod ||
      order?.paymentmethod ||
      order?.payment?.paymentMethod ||
      ""
  )
    .toUpperCase()
    .trim();

const getCustomerName = (order) =>
  order?.userId?.FullName ||
  order?.userId?.fullName ||
  order?.userId?.name ||
  order?.customerName ||
  "Customer";

const getOrderNumber = (order) =>
  String(order?.orderNumber || order?._id || "")
    .slice(-8)
    .toUpperCase();

const getDiscount = (order) =>
  Math.max(
    0,
    Number(
      order?.discountamount ??
        order?.discountAmount ??
        order?.totalDiscount ??
        order?.discount ??
        0
    )
  ) +
  Math.max(
    0,
    Number(
      order?.coupondiscount ??
        order?.couponDiscount ??
        order?.couponDiscountAmount ??
        0
    )
  );

// Final amount after discounts
const getNetSales = (order) =>
  Math.max(
    0,
    Number(
      order?.total ??
        order?.totalAmount ??
        order?.grandTotal ??
        order?.finalAmount ??
        order?.payableAmount ??
        0
    )
  );

// Original sales amount before discounts
const getGrossSales = (order) => getNetSales(order) + getDiscount(order);

// ==========================================
// SALES ELIGIBILITY
// ==========================================

const isEligibleSale = (order) => {
  const status = getStatus(order);
  const method = getPaymentMethod(order);
  const paymentStatus = getPaymentStatus(order);

  if (
    ["cancelled", "returned", "refunded"].includes(status) ||
    ["failed", "refunded", "cancelled"].includes(paymentStatus)
  ) {
    return false;
  }

  // COD orders count only after delivery.
  if (method === "COD") {
    return ["delivered", "completed"].includes(status);
  }

  // Online and wallet orders require successful payment.
  if (["ONLINE", "WALLET"].includes(method)) {
    return paymentStatus === "paid";
  }

  return false;
};

// ==========================================
// SALES REPORT
// ==========================================

const SalesReport = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getLocalDate());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // FETCH ORDERS
  // ==========================================

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/admin/orders");

      const result =
        response?.data?.data ??
        response?.data?.orders ??
        response?.data;

      if (!Array.isArray(result)) {
        console.error("Unexpected orders API response:", response?.data);
        throw new Error("Invalid orders response from server");
      }

      console.log("SALES REPORT: orders received =", result.length);
      setOrders(result);
    } catch (err) {
      console.error("SALES REPORT ERROR:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load sales report"
      );

      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ==========================================
  // FILTER SALES BY SELECTED DATE
  // DIAGNOSTIC LOGS PRESERVED
  // ==========================================

  const salesOrders = useMemo(() => {
    console.log("TOTAL ORDERS:", orders.length);
    console.log("SELECTED DATE:", selectedDate);

    console.log(
      "ORDER STATUS COUNTS:",
      orders.reduce((counts, order) => {
        const status = getStatus(order) || "empty";
        counts[status] = (counts[status] || 0) + 1;
        return counts;
      }, {})
    );

    console.log(
      "SAMPLE ORDERS:",
      orders.slice(0, 5).map((order) => ({
        id: order._id,
        createdAt: order.createdAt,
        status: getStatus(order),
        paymentStatus: getPaymentStatus(order),
        paymentMethod: getPaymentMethod(order),
      }))
    );

    const eligibleOrders = orders.filter(isEligibleSale);

    console.log(
      "ORDERS PASSING PAYMENT AND STATUS FILTER:",
      eligibleOrders.length
    );

    console.log(
      "ELIGIBLE ORDER DATES:",
      eligibleOrders.map((order) => ({
        id: order._id,
        createdAt: order.createdAt,
        localDate: order.createdAt
          ? getLocalDate(new Date(order.createdAt))
          : "Missing date",
      }))
    );

    const dateMatchedOrders = eligibleOrders.filter((order) => {
      const orderDate = new Date(order?.createdAt);

      if (Number.isNaN(orderDate.getTime())) return false;

      return getLocalDate(orderDate) === selectedDate;
    });

    console.log("ORDERS MATCHING SELECTED DATE:", dateMatchedOrders.length);

    return dateMatchedOrders.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [orders, selectedDate]);

  // ==========================================
  // SUMMARY - UPDATED SALES CALCULATION ONLY
  // ==========================================

  const summary = useMemo(() => {
    const totals = salesOrders.reduce(
      (result, order) => {
        result.orderCount += 1;
        result.netSales += getNetSales(order);
        result.discounts += getDiscount(order);
        result.grossSales += getGrossSales(order);

        return result;
      },
      {
        orderCount: 0,
        grossSales: 0,
        discounts: 0,
        netSales: 0,
      }
    );

    Object.keys(totals).forEach((key) => {
      if (key !== "orderCount") {
        totals[key] = Number(totals[key].toFixed(2));
      }
    });

    return totals;
  }, [salesOrders]);

  // ==========================================
  // PAYMENT LABEL
  // ==========================================

  const getPaymentLabel = (order) => {
    const method = getPaymentMethod(order);

    if (method === "COD") return "Cash on Delivery";
    if (method === "ONLINE") return "Online Payment";
    if (method === "WALLET") return "Wallet";

    return method || "-";
  };

  // ==========================================
  // EXPORT EXCEL
  // ==========================================

  const exportExcel = () => {
    if (!salesOrders.length) return;

    const rows = salesOrders.map((order) => ({
      "Order ID": getOrderNumber(order),
      Date: new Date(order.createdAt).toLocaleString("en-IN"),
      Customer: getCustomerName(order),
      "Gross Sales (INR)": getGrossSales(order),
      "Discounts (INR)": getDiscount(order),
      "Net Sales (INR)": getNetSales(order),
      Payment: getPaymentLabel(order),
      Status: getStatus(order),
    }));

    rows.push({
      "Order ID": "TOTAL",
      Date: selectedDate,
      Customer: "",
      "Gross Sales (INR)": summary.grossSales,
      "Discounts (INR)": summary.discounts,
      "Net Sales (INR)": summary.netSales,
      Payment: "",
      Status: `${summary.orderCount} completed orders`,
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);

    worksheet["!cols"] = [
      { wch: 16 },
      { wch: 22 },
      { wch: 24 },
      { wch: 20 },
      { wch: 18 },
      { wch: 18 },
      { wch: 22 },
      { wch: 16 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Report");
    XLSX.writeFile(workbook, `aureya-sales-${selectedDate}.xlsx`);
  };

  // ==========================================
  // EXPORT PDF
  // ==========================================

const exportPDF = () => {
  if (!salesOrders.length) return;

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();

  // Report title
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("Aureya - Daily Sales Report", 14, 18);

  // Report date
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.text(`Report date: ${selectedDate}`, 14, 28);

  // Summary - separate rows to avoid clipping
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);

  pdf.text(
    `Completed orders: ${summary.orderCount}`,
    14,
    38
  );

  pdf.text(
    `Gross sales: ${money(summary.grossSales)}`,
    14,
    46
  );

  pdf.text(
    `Discounts: ${money(summary.discounts)}`,
    110,
    46
  );

  pdf.text(
    `Net sales: ${money(summary.netSales)}`,
    205,
    46
  );

  // Order table
  autoTable(pdf, {
    startY: 54,
    margin: { left: 14, right: 14 },
    head: [[
      "Order ID",
      "Date",
      "Customer",
      "Gross (INR)",
      "Discount",
      "Net Sales",
      "Payment",
      "Status",
    ]],
    body: salesOrders.map((order) => [
      getOrderNumber(order),
      new Date(order.createdAt).toLocaleString("en-IN"),
      getCustomerName(order),
      getGrossSales(order).toFixed(2),
      getDiscount(order).toFixed(2),
      getNetSales(order).toFixed(2),
      getPaymentLabel(order),
      getStatus(order),
    ]),
    foot: [[
      "TOTAL",
      selectedDate,
      `${summary.orderCount} orders`,
      summary.grossSales.toFixed(2),
      summary.discounts.toFixed(2),
      summary.netSales.toFixed(2),
      "",
      "",
    ]],
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [54, 83, 120],
    },
    footStyles: {
      fillColor: [235, 240, 246],
      textColor: [20, 35, 55],
    },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 36 },
      2: { cellWidth: 30 },
      3: { cellWidth: 27 },
      4: { cellWidth: 23 },
      5: { cellWidth: 27 },
      6: { cellWidth: 32 },
      7: { cellWidth: 24 },
    },
  });

  pdf.save(`aureya-sales-${selectedDate}.pdf`);
};

  
  // ==========================================
  // UI
  // ==========================================

  return (
    <main className="sales-report-page">
      <header className="sales-report-header">
        <div>
          <h1>Sales Report</h1>
          <p>Daily sales summary and completed orders</p>
        </div>

        <div className="sales-report-actions">
          <button
            type="button"
            className="sales-btn sales-btn-light"
            onClick={() => navigate(-1)}
          >
            Back to Orders
          </button>

          <button
            type="button"
            className="sales-btn sales-btn-light"
            onClick={exportExcel}
            disabled={loading || !salesOrders.length}
          >
            Download Excel
          </button>

          <button
            type="button"
            className="sales-btn"
            onClick={exportPDF}
            disabled={loading || !salesOrders.length}
          >
            Download PDF
          </button>
        </div>
      </header>

      <section className="sales-report-filter">
        <label htmlFor="sales-date">Select sales date</label>

        <input
          id="sales-date"
          type="date"
          value={selectedDate}
          max={getLocalDate()}
          onChange={(event) => setSelectedDate(event.target.value)}
        />

        <button
          type="button"
          className="sales-btn sales-btn-light"
          onClick={fetchOrders}
          disabled={loading}
        >
          Refresh
        </button>
      </section>

      {loading ? (
        <div className="sales-report-message">Loading sales report...</div>
      ) : error ? (
        <div className="sales-report-error">
          <p>{error}</p>
          <button type="button" className="sales-btn" onClick={fetchOrders}>
            Try Again
          </button>
        </div>
      ) : (
        <>
          <section className="sales-summary-grid">
            <article className="sales-summary-card">
              <span>Completed Orders</span>
              <strong>{summary.orderCount}</strong>
            </article>

            <article className="sales-summary-card">
              <span>Gross Sales</span>
              <strong>{money(summary.grossSales)}</strong>
            </article>

            <article className="sales-summary-card">
              <span>Total Discounts</span>
              <strong>{money(summary.discounts)}</strong>
            </article>

            <article className="sales-summary-card sales-summary-net">
              <span>Net Sales</span>
              <strong>{money(summary.netSales)}</strong>
            </article>
          </section>

          <section className="sales-report-table-card">
            <div className="sales-table-heading">
              <div>
                <h2>Order-wise Sales</h2>
                <p>
                  {selectedDate} · {salesOrders.length} completed orders
                </p>
              </div>
            </div>

            <div className="sales-table-scroll">
              <table className="sales-report-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Gross</th>
                    <th>Discount</th>
                    <th>Net Sales</th>
                    <th>Payment</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {salesOrders.length ? (
                    salesOrders.map((order) => (
                      <tr key={order._id}>
                        <td>#{getOrderNumber(order)}</td>
                        <td>
                          {new Date(order.createdAt).toLocaleString("en-IN")}
                        </td>
                        <td>{getCustomerName(order)}</td>
                        <td>{money(getGrossSales(order))}</td>
                        <td>{money(getDiscount(order))}</td>
                        <td className="sales-net-value">
                          {money(getNetSales(order))}
                        </td>
                        <td>{getPaymentLabel(order)}</td>
                        <td>
                          <span className="sales-status">
                            {getStatus(order) || "-"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="sales-empty">
                        No completed sales found for this date.
                      </td>
                    </tr>
                  )}
                </tbody>

                {salesOrders.length > 0 && (
                  <tfoot>
                    <tr>
                      <td colSpan="3">TOTAL</td>
                      <td>{money(summary.grossSales)}</td>
                      <td>{money(summary.discounts)}</td>
                      <td>{money(summary.netSales)}</td>
                      <td colSpan="2">{summary.orderCount} orders</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
};

export default SalesReport;

