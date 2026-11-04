const PDFDocument = require("pdfkit");

const {
  Getmyorder,
  CancelOrder,
  GetInvoice,
  ReturnOrder
} = require("../services/orderdetails");


// ==========================================
// GET MY ORDERS
// ==========================================

const getOrdermy = async (
  req,
  res
) => {

  try {
 console.log("USER FROM TOKEN:", req.user);
    console.log("USER ID:", req.user?.id);
    console.log("USER _ID:", req.user?._id);
    const userId =
      req.user.id;

    console.log(
      "MY ORDER USER ID:",
      userId
    );

    const order =
      await Getmyorder(
        userId
      );

    console.log(
      "MY ORDERS:",
      order
    );

    return res.status(200).json({
      message:
        "Orders fetched successfully",

      data: order,
    });

  } catch (error) {

    console.error(
      "GET MY ORDER ERROR:",
      error
    );

    return res.status(400).json({
      message:
        error.message,
    });
  }
};


// ==========================================
// CANCEL ORDER ITEM
// ==========================================
// ==========================================
// CANCEL ORDER ITEM
// ==========================================

// ==========================================
// CANCEL ORDER ITEM
// ==========================================

const cancelOrderItem = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { itemId } = req.params;
    const { reason } = req.body;

    console.log("CANCEL USER ID:", userId);
    console.log("CANCEL ITEM ID:", itemId);
    console.log("CANCEL REASON:", reason);

    if (!userId) {
      return res.status(401).json({
        message: "Please login to cancel an item",
      });
    }

    if (!itemId) {
      return res.status(400).json({
        message: "Order item ID is required",
      });
    }

    // Order must match the service: (itemId, reason, userId)
    const cancelledItem = await CancelOrder(itemId, reason, userId);

    return res.status(200).json({
      message: "Order item cancelled successfully",
      data: cancelledItem,
    });
  } catch (error) {
    console.error("CANCEL ORDER ITEM ERROR:", error);

    return res.status(400).json({
      message: error.message,
    });
  }
};


// ==========================================
// GET INDIVIDUAL INVOICE PDF
// ==========================================

const getInvoice = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        message: "Order ID is required",
      });
    }

    console.log("INVOICE ORDER ID:", orderId);
    console.log("INVOICE ITEM ID:", itemId || "FULL ORDER");

    // Without itemId, generate the invoice for the entire order.
    const invoice = await GetInvoice(orderId, itemId || null);

    if (!invoice || !invoice.order) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    const order = invoice.order;
    let items = [];

    // Individual item invoice.
    if (itemId) {
      const selectedItem =
        invoice.item ||
        (Array.isArray(invoice.items)
          ? invoice.items.find(
              (entry) =>
                String(entry._id) === String(itemId) ||
                String(entry.id) === String(itemId)
            )
          : null);

      if (selectedItem) {
        items = [selectedItem];
      }
    } else if (Array.isArray(invoice.items)) {
      // Entire order invoice.
      items = invoice.items;
    } else if (invoice.item) {
      items = [invoice.item];
    }

    if (!items.length) {
      return res.status(404).json({
        message: itemId
          ? "Invoice item not found"
          : "No items found for this order. Ensure invoiceget returns all order items.",
      });
    }

    const doc = new PDFDocument({
      size: "A4",
      margin: 42,
      bufferPages: true,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="invoice-${itemId || orderId}.pdf"`
    );

    doc.on("error", (error) => {
      console.error("INVOICE PDF STREAM ERROR:", error);

      if (!res.headersSent) {
        res.status(500).end("Unable to generate invoice");
      } else if (!res.writableEnded) {
        res.end();
      }
    });

    doc.pipe(res);

    const pageWidth = doc.page.width;
    const left = doc.page.margins.left;
    const right = pageWidth - doc.page.margins.right;
    const contentWidth = right - left;

    const orderDate = order.createdAt
      ? new Date(order.createdAt).toLocaleDateString("en-IN")
      : "-";

    const invoiceNumber = String(
      order.orderId || order._id || orderId
    );

    const customerName = order.address?.name || "Customer";
    const addressText = order.address?.address || "-";
    const pincode = order.address?.pincode || "-";

    // ==========================================
    // INVOICE HEADER — AUREYA BRANDING
    // No logo and no QR code.
    // ==========================================

    doc
      .fillColor("#171717")
      .font("Helvetica-Bold")
      .fontSize(22)
      .text("AUREYA", left, 38);

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#555555")
      .text("YOUR ONLINE STORE", left, 63);

    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .fillColor("#171717")
      .text("TAX INVOICE", left, 86, {
        width: contentWidth,
        align: "right",
      });

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#555555")
      .text(`Invoice No: ${invoiceNumber}`, left, 111, {
        width: contentWidth,
        align: "right",
      });

    doc
      .strokeColor("#b8b8b8")
      .lineWidth(0.8)
      .moveTo(left, 132)
      .lineTo(right, 132)
      .stroke();

    // ==========================================
    // ORDER AND CUSTOMER INFORMATION
    // ==========================================

    let y = 146;
    const gap = 18;
    const columnWidth = (contentWidth - gap) / 2;

    doc.font("Helvetica-Bold").fontSize(10).fillColor("#171717");

    doc.text("ORDER INFORMATION", left, y);
    doc.text("BILL TO / SHIP TO", left + columnWidth + gap, y);

    y += 18;

    doc.font("Helvetica").fontSize(9).fillColor("#333333");

    doc.text(`Order ID: ${order._id || orderId}`, left, y, {
      width: columnWidth,
    });

    doc.text(customerName, left + columnWidth + gap, y, {
      width: columnWidth,
    });

    y += 15;

    doc.text(`Order Date: ${orderDate}`, left, y, {
      width: columnWidth,
    });

    doc.text(addressText, left + columnWidth + gap, y, {
      width: columnWidth,
    });

    y += 15;

    doc.text(
      `Payment Method: ${order.paymentmethod || "-"}`,
      left,
      y,
      { width: columnWidth }
    );

    doc.text(`Pincode: ${pincode}`, left + columnWidth + gap, y, {
      width: columnWidth,
    });

    y += 15;

    doc.text(
      `Payment Status: ${order.paymentstatus || "-"}`,
      left,
      y,
      { width: columnWidth }
    );

    y += 27;

    doc.font("Helvetica-Bold").fontSize(12).fillColor("#171717");

    doc.text(itemId ? "INVOICED ITEM" : "ORDER ITEMS", left, y);

    y += 20;

    // ==========================================
    // PRODUCT TABLE
    // ==========================================

    const columns = {
      product: left,
      qty: left + contentWidth * 0.58,
      price: left + contentWidth * 0.69,
      total: left + contentWidth * 0.83,
    };

    const tableRight = right;

    const drawTableHeader = (top) => {
      doc.rect(left, top, contentWidth, 24).fill("#365378");

      doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9);

      doc.text("Product / Variant", columns.product + 8, top + 7, {
        width: contentWidth * 0.55 - 8,
      });

      doc.text("Qty", columns.qty, top + 7, {
        width: contentWidth * 0.09,
        align: "right",
      });

      doc.text("Unit Price (INR)", columns.price - 8, top + 7, {
        width: contentWidth * 0.14,
        align: "right",
      });

      doc.text("Total (INR)", columns.total - 2, top + 7, {
        width: tableRight - columns.total,
        align: "right",
      });

      return top + 24;
    };

    y = drawTableHeader(y);

    doc.fillColor("#222222");

    let calculatedTotal = 0;

    items.forEach((currentItem, index) => {
      const quantity = Number(currentItem.quantity || 1);
      const price = Number(currentItem.price || 0);
      const itemTotal = price * quantity;

      calculatedTotal += itemTotal;

      const productName =
        currentItem.productId?.productName || "Product";

      const variantName =
        currentItem.variantId?.variantName || "-";

      const productBlockHeight = 43;

      if (y + productBlockHeight > doc.page.height - 95) {
        doc.addPage();
        y = doc.page.margins.top;
        y = drawTableHeader(y);
      }

      if (index % 2 === 0) {
        doc
          .rect(left, y, contentWidth, productBlockHeight)
          .fill("#f4f6f8");
      }

      doc.fillColor("#222222").font("Helvetica-Bold").fontSize(9);

      doc.text(productName, columns.product + 8, y + 7, {
        width: contentWidth * 0.53 - 12,
        height: 12,
        ellipsis: true,
      });

      doc.font("Helvetica").fontSize(8).fillColor("#555555");

      doc.text(
        `${variantName} | Size: ${currentItem.variantId?.size || "-"} | Color: ${currentItem.variantId?.color || "-"}`,
        columns.product + 8,
        y + 22,
        {
          width: contentWidth * 0.55 - 12,
          height: 12,
          ellipsis: true,
        }
      );

      doc.font("Helvetica").fontSize(9).fillColor("#222222");

      doc.text(String(quantity), columns.qty, y + 14, {
        width: contentWidth * 0.09,
        align: "right",
      });

      doc.text(price.toFixed(2), columns.price - 8, y + 14, {
        width: contentWidth * 0.14,
        align: "right",
      });

      doc
        .font("Helvetica-Bold")
        .text(itemTotal.toFixed(2), columns.total - 2, y + 14, {
          width: tableRight - columns.total,
          align: "right",
        });

      doc
        .strokeColor("#d7dce2")
        .lineWidth(0.5)
        .moveTo(left, y + productBlockHeight)
        .lineTo(right, y + productBlockHeight)
        .stroke();

      y += productBlockHeight;
    });
// ==========================================
// TOTALS: SUBTOTAL, DISCOUNT, DELIVERY, TAX
// ==========================================

const savedOrderTotal = Number(
  order.totalAmount ??
    order.totalPrice ??
    order.grandTotal ??
    order.total ??
    NaN
);

// Read totals from the saved order.
// Defaults are zero if the order doesn't store these fields.
const subtotal = Number(
  order.subtotal ??
    order.subTotal ??
    order.itemsTotal ??
    calculatedTotal
);

const discount = Number(
  order.discountAmount ??
    order.discountamount ??
    order.totalDiscount ??
    0
);

const deliveryCharge = Number(
  order.deliveryCharge ??
    order.deliverycharge ??
    order.shippingCharge ??
    order.shippingCost ??
    0
);

const tax = Number(
  order.taxAmount ??
    order.taxamount ??
    order.tax ??
    0
);

const invoiceTotal = Number.isFinite(savedOrderTotal)
  ? savedOrderTotal
  : Math.max(0, subtotal - discount + deliveryCharge + tax);

// For an individual invoice, show only the selected item's amount.
// For an entire order, show the saved order totals.
const finalTotal = itemId
  ? calculatedTotal
  : invoiceTotal;

if (y + 150 > doc.page.height - doc.page.margins.bottom) {
  doc.addPage();
  y = doc.page.margins.top;
}

y += 18;

doc
  .strokeColor("#b8b8b8")
  .lineWidth(0.8)
  .moveTo(left, y)
  .lineTo(right, y)
  .stroke();

y += 18;

const drawTotalRow = (label, amount, bold = false) => {
  doc
    .font(bold ? "Helvetica-Bold" : "Helvetica")
    .fontSize(bold ? 11 : 10)
    .fillColor("#333333")
    .text(label, left, y, {
      width: contentWidth * 0.65,
    });

  doc
    .font(bold ? "Helvetica-Bold" : "Helvetica")
    .fontSize(bold ? 11 : 10)
    .fillColor("#171717")
    .text(`Rs. ${Number(amount || 0).toFixed(2)}`, left, y, {
      width: contentWidth,
      align: "right",
    });

  y += bold ? 24 : 19;
};

drawTotalRow("Items Subtotal", itemId ? calculatedTotal : subtotal);

if (!itemId) {
  drawTotalRow("Discount", -discount);
  drawTotalRow("Delivery Charge", deliveryCharge);
  drawTotalRow("Tax", tax);
}

y += 4;

doc
  .strokeColor("#b8b8b8")
  .moveTo(left, y)
  .lineTo(right, y)
  .stroke();

y += 14;

drawTotalRow(
  itemId ? "ITEM TOTAL" : "GRAND TOTAL",
  finalTotal,
  true
);

    // ==========================================
    // FOOTER — AUREYA BRANDING
    // ==========================================

    const footerY = doc.page.height - 75;

    doc
      .strokeColor("#b8b8b8")
      .lineWidth(0.8)
      .moveTo(left, footerY)
      .lineTo(right, footerY)
      .stroke();

    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("#171717")
      .text("AUREYA", left, footerY + 14, {
        width: contentWidth,
        align: "center",
      });

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#555555")
      .text(
        itemId
          ? "Thank you for shopping with Aureya."
          : "Thank you for shopping with Aureya. We appreciate your order.",
        left,
        footerY + 33,
        {
          width: contentWidth,
          align: "center",
        }
      );

    doc.end();
  } catch (error) {
    console.error("GET INVOICE ERROR:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        message: error.message || "Unable to generate invoice",
      });
    }

    if (!res.writableEnded) {
      res.end();
    }
  }
};

const returnOrder = async (
  req,
  res
) => {
  try {
    const { itemId } = req.params;

    const {
      itemIds,
      reason,
    } = req.body;

    // --------------------------------------
    // SUPPORT SINGLE + BULK
    // --------------------------------------

    let selectedItemIds = [];

    if (Array.isArray(itemIds)) {
      selectedItemIds = itemIds;
    } else if (itemId) {
      selectedItemIds = [itemId];
    }

    // --------------------------------------
    // VALIDATE
    // --------------------------------------

    if (
      selectedItemIds.length === 0
    ) {
      return res.status(400).json({
        message:
          "At least one item must be selected",
      });
    }

    if (!reason?.trim()) {
      return res.status(400).json({
        message:
          "Return reason is required",
      });
    }

    // --------------------------------------
    // RETURN ITEM(S)
    // --------------------------------------

    const result =
      await ReturnOrder(
        selectedItemIds,
        reason
      );

    // --------------------------------------
    // SUCCESS
    // --------------------------------------

    return res.status(200).json({
      message:
        selectedItemIds.length === 1
          ? "Return request submitted successfully"
          : "Return requests submitted successfully",
      data: result,
    });
  } catch (error) {
    console.error(
      "RETURN ORDER CONTROLLER ERROR:",
      error
    );

    return res.status(400).json({
      message:
        error.message ||
        "Unable to submit return request",
    });
  }
};
// ==========================================
// EXPORT
// ==========================================

module.exports = {
  getOrdermy,
  cancelOrderItem,
  getInvoice,
  returnOrder
};