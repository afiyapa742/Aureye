import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import API from "../api/axios";
import "./TrackOrder.css";

// ==========================================
// CONFIG
// ==========================================

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://aureyaforwomen.shop/api";

const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

const ORDERS_PAGE = "/profile/orders";

const PAYMENT_METHOD_LABELS = {
  COD: "Cash on Delivery",
  ONLINE: "Online Payment",
  WALLET: "Wallet",
};

// Main delivery steps.
const STATUS_ORDER = {
  pending: 0,
  confirmed: 1,
  processing: 2,
  shipped: 3,
  out_for_delivery: 4,
  delivered: 5,
};

// Statuses that happen after delivery.
// The delivery steps stay completed for these.
const AFTER_DELIVERY_NOTES = {
  return_requested: "Return requested. We will contact you shortly.",
  return_approved: "Your return request has been approved.",
  return_rejected: "Your return request was rejected.",
  return_pickup_scheduled: "Return pickup has been scheduled.",
  returned: "This item has been returned.",
  refunded: "Your refund has been processed.",
};

const PROGRESS_WIDTH = {
  pending: "0%",
  confirmed: "16.67%",
  processing: "33.33%",
  shipped: "50%",
  out_for_delivery: "66.67%",
  delivered: "83.33%",
};

const TrackOrder = () => {
  const { orderId, itemId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // FETCH
  // ==========================================

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await API.get(
          `/myorder/orders/${orderId}/track/${itemId}`
        );

        const result = response.data?.data;

        if (!result?.order || !result?.orderItem) {
          setError("Order details not found.");
          return;
        }

        setOrder(result.order);
        setSelectedItem(result.orderItem);
      } catch (err) {
        console.error("TRACK ORDER ERROR:", err?.response?.data || err);

        setError(
          err?.response?.data?.message || "Unable to load order tracking."
        );
      } finally {
        setLoading(false);
      }
    };

    if (orderId && itemId) {
      fetchOrder();
    } else {
      setLoading(false);
      setError("Order ID or Item ID is missing.");
    }
  }, [orderId, itemId]);

  // ==========================================
  // HELPERS
  // ==========================================

  const formatDate = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "";

    return parsedDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // The ITEM status has priority. The order status is only
  // a fallback, so a cancelled / returned item is tracked
  // correctly even when the order status did not change.
  const getCurrentStatus = () =>
    String(
      selectedItem?.status ||
        selectedItem?.itemstatus ||
        selectedItem?.itemStatus ||
        selectedItem?.orderstatus ||
        order?.orderstatus ||
        "confirmed"
    )
      .toLowerCase()
      .trim()
      .replaceAll(" ", "_");

  const getProductName = () =>
    selectedItem?.productId?.productName ||
    selectedItem?.productId?.Productname ||
    selectedItem?.productId?.name ||
    selectedItem?.productName ||
    "Product";

  const getProductImage = () => {
    const image =
      selectedItem?.variantId?.productImages?.[0]?.imageUrl ||
      selectedItem?.productId?.image ||
      selectedItem?.productId?.productImage ||
      (Array.isArray(selectedItem?.productId?.images)
        ? selectedItem.productId.images[0]
        : "") ||
      "";

    if (!image) return "";

    let imagePath = String(image).trim();

    if (!imagePath) return "";

    if (/^https?:\/\//i.test(imagePath)) {
      if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(imagePath)) {
        return imagePath;
      }

      imagePath = imagePath.replace(
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i,
        ""
      );
    }

    imagePath = imagePath.replace(/^\/+/, "");

    if (imagePath.startsWith("uploads/")) {
      return `${API_ORIGIN}/${imagePath}`;
    }

    return `${API_ORIGIN}/uploads/${imagePath}`;
  };

  const getPaymentMethod = () => {
    const method = order?.paymentmethod || order?.paymentMethod || "COD";

    return PAYMENT_METHOD_LABELS[String(method).toUpperCase()] || method;
  };

  const getStatusLabel = (currentStatus) =>
    String(currentStatus).replaceAll("_", " ").toUpperCase();

  // ==========================================
  // AMOUNTS
  // This page tracks ONE item. When the order has
  // several items, the order amounts are split by
  // this item's share of the order subtotal.
  // ==========================================

  const itemPrice = Number(selectedItem?.price || 0);
  const itemQuantity = Number(selectedItem?.quantity || 1);
  const itemLineTotal = itemPrice * itemQuantity;

  const orderItems = Array.isArray(order?.items) ? order.items : [];
  const orderSubtotal = Number(order?.subtotal ?? itemLineTotal);

  const isMultiItemOrder = orderItems.length > 1 && orderSubtotal > 0;

  const itemShare = isMultiItemOrder ? itemLineTotal / orderSubtotal : 1;

  const displaySubtotal = isMultiItemOrder ? itemLineTotal : orderSubtotal;

  const orderTotal = order?.total ?? order?.grandTotal;

  const displayTotal =
    orderTotal !== undefined && orderTotal !== null
      ? Number(orderTotal) * itemShare
      : itemLineTotal;

  // ==========================================
  // TIMELINE
  // ==========================================

  const status = getCurrentStatus();

  const isCancelled = status === "cancelled" || status === "canceled";

  const afterDeliveryNote = AFTER_DELIVERY_NOTES[status] || "";

  const timeline = [
    {
      key: "pending",
      label: "Pending",
      date: selectedItem?.createdAt || order?.createdAt,
    },
    {
      key: "confirmed",
      label: "Confirmed",
      date: selectedItem?.confirmedAt,
    },
    {
      key: "processing",
      label: "Processing",
      date: selectedItem?.processingAt,
    },
    {
      key: "shipped",
      label: "Shipped",
      date: selectedItem?.shippedAt,
    },
    {
      key: "out_for_delivery",
      label: "Out for Delivery",
      date: selectedItem?.outForDeliveryAt,
    },
    {
      key: "delivered",
      label: "Delivered",
      date: selectedItem?.deliveredAt,
    },
  ];

  // Position of the current status in the delivery steps.
  // Return / refund statuses are treated as "delivered".
  const getCurrentIndex = () => {
    if (STATUS_ORDER[status] !== undefined) {
      return STATUS_ORDER[status];
    }

    if (afterDeliveryNote) {
      return STATUS_ORDER.delivered;
    }

    return STATUS_ORDER.confirmed;
  };

  const getStepState = (stepKey) => {
    const currentIndex = getCurrentIndex();
    const stepIndex = STATUS_ORDER[stepKey];

    if (stepIndex < currentIndex) return "completed";

    if (stepIndex === currentIndex) return "active";

    return "upcoming";
  };

  const getProgressWidth = () => {
    if (PROGRESS_WIDTH[status] !== undefined) {
      return PROGRESS_WIDTH[status];
    }

    if (afterDeliveryNote) {
      return PROGRESS_WIDTH.delivered;
    }

    return PROGRESS_WIDTH.confirmed;
  };

  const getLastUpdated = () => {
    const lastDate =
      selectedItem?.deliveredAt ||
      selectedItem?.outForDeliveryAt ||
      selectedItem?.shippedAt ||
      selectedItem?.processingAt ||
      selectedItem?.confirmedAt ||
      order?.updatedAt;

    return formatDate(lastDate);
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="track-order-page">
        <div className="track-loading">Loading order tracking...</div>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="track-order-page">
        <div className="track-error">
          <p>{error}</p>

          <button type="button" onClick={() => navigate(ORDERS_PAGE)}>
            Back to My Orders
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="track-order-page">
      <div className="track-order-card">
        {/* Header */}
        <div className="track-header">
          <h1>Track Order</h1>

          <p>
            Ordered on <span>{formatDate(order?.createdAt)}</span>
            {" | "}
            Order <span>#{order?.orderId || order?._id}</span>
          </p>
        </div>

        {/* Main Details */}
        <div className="track-main-section">
          {/* Product */}
          <div className="track-product-section">
            <div className="track-product-image">
              {getProductImage() ? (
                <img src={getProductImage()} alt={getProductName()} />
              ) : (
                <div className="track-image-placeholder">No Image</div>
              )}
            </div>

            <div className="track-product-details">
              <h3>{getProductName()}</h3>

              <p className="track-product-price">₹{itemPrice.toFixed(2)}</p>

              <p className="track-product-quantity">
                Quantity: {itemQuantity}
              </p>

              <div className="track-status-row">
                <span>Status:</span>

                <strong className={`track-status ${status}`}>
                  {getStatusLabel(status)}
                </strong>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="track-info-block">
            <h4>Shipping Address</h4>

            <p>
              {order?.address?.name ||
                order?.shippingAddress?.name ||
                "Customer"}
            </p>

            <p>
              {order?.address?.address ||
                order?.shippingAddress?.address ||
                ""}
            </p>

            <p>
              {order?.address?.pincode ||
                order?.shippingAddress?.pincode ||
                ""}
            </p>
          </div>

          {/* Payment */}
          <div className="track-info-block">
            <h4>Payment Method</h4>

            <p>{getPaymentMethod()}</p>
          </div>

          {/* Order Summary */}
          <div className="track-summary-card">
            <h4>Order Summary</h4>

            <div className="summary-row">
              <span>Payment</span>
              <span>{getPaymentMethod()}</span>
            </div>

            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{Number(displaySubtotal).toFixed(2)}</span>
            </div>

            <div className="summary-row">
              <span>Total</span>
              <span>₹{Number(displayTotal).toFixed(2)}</span>
            </div>

            <div className="summary-divider" />

            <div className="summary-total">
              <span>Grand Total</span>
              <strong>₹{Number(displayTotal).toFixed(2)}</strong>
            </div>
          </div>
        </div>

        {/* Delivery Date (not shown for cancelled items) */}
        {order?.deliverydate && !isCancelled && (
          <div className="expected-delivery">
            <span>Expected Delivery</span>

            <strong>{formatDate(order.deliverydate)}</strong>
          </div>
        )}

        {/* Tracking */}
        <div className="tracking-section">
          <h3>Order Tracking</h3>

          {isCancelled ? (
            <div className="cancelled-message">
              <div className="cancelled-dot" />

              <div>
                <strong>Order Cancelled</strong>

                {selectedItem?.cancelledAt && (
                  <p>{formatDate(selectedItem.cancelledAt)}</p>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="tracking-line-container">
                <div className="tracking-base-line" />

                <div
                  className="tracking-progress-line"
                  style={{ width: getProgressWidth() }}
                />

                <div className="tracking-steps">
                  {timeline.map((step) => {
                    const stepState = getStepState(step.key);

                    return (
                      <div
                        className={`tracking-step ${stepState}`}
                        key={step.key}
                      >
                        <div className="tracking-circle">
                          {stepState === "completed" ||
                          stepState === "active"
                            ? "✓"
                            : ""}
                        </div>

                        <div className="tracking-step-label">
                          <span>{step.label}</span>

                          {step.date && (
                            <small>{formatDate(step.date)}</small>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Processing information */}
              {status === "processing" && (
                <div className="processing-note">
                  Your order is being prepared for shipment.
                </div>
              )}

              {/* Return / refund information */}
              {afterDeliveryNote && (
                <div className="processing-note">{afterDeliveryNote}</div>
              )}

              {/* Last updated */}
              <div className="tracking-last-update">
                Last updated: {getLastUpdated()}
              </div>
            </>
          )}
        </div>

        <div className="track-actions">
          <button type="button" onClick={() => navigate(-1)}>
            Back to My Orders
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;