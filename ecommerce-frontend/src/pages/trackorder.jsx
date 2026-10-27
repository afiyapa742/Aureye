import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";
import "./TrackOrder.css";

const TrackOrder = () => {
  const { orderId, itemId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        console.error(
          "TRACK ORDER ERROR:",
          err?.response?.data || err
        );

        setError(
          err?.response?.data?.message ||
            "Unable to load order tracking."
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

  const formatDate = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    return parsedDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    return parsedDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getCurrentStatus = () => {
    if (!selectedItem?.status) {
      return "confirmed";
    }

    return String(selectedItem.status).toLowerCase();
  };

  const getProductName = () => {
    return (
      selectedItem?.productId?.productName ||
      selectedItem?.productId?.Productname ||
      selectedItem?.productId?.name ||
      selectedItem?.productName ||
      "Product"
    );
  };

  const getProductImage = () => {
    const image =
      selectedItem?.variantId?.productImages?.[0]?.imageUrl ||
      selectedItem?.productId?.image ||
      selectedItem?.productId?.productImage ||
      (Array.isArray(selectedItem?.productId?.images)
        ? selectedItem.productId.images[0]
        : "") ||
      "";

    if (!image) {
      return "";
    }

    if (String(image).startsWith("http")) {
      return image;
    }

    if (String(image).startsWith("/uploads/")) {
      return `http://localhost:5000${image}`;
    }

    return `http://localhost:5000/uploads/${image}`;
  };

  const getPaymentMethod = () => {
    return (
      order?.paymentmethod ||
      order?.paymentMethod ||
      "COD"
    );
  };

  const getTotal = () => {
    return (
      order?.total ??
      order?.grandTotal ??
      selectedItem?.price * selectedItem?.quantity ??
      0
    );
  };

  const status = getCurrentStatus();

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

  const statusOrder = {
    pending: 0,
    confirmed: 1,
    processing: 2,
    shipped: 3,
    out_for_delivery: 4,
    delivered: 5,
  };

  const getStepState = (stepKey) => {
    if (status === "cancelled") {
      return "cancelled";
    }

    const currentIndex =
      statusOrder[status] ?? statusOrder.confirmed;

    const stepIndex = statusOrder[stepKey];

    if (stepIndex < currentIndex) {
      return "completed";
    }

    if (stepIndex === currentIndex) {
      return "active";
    }

    return "upcoming";
  };

  const getProgressWidth = () => {
    if (status === "pending") {
      return "0%";
    }

    if (status === "confirmed") {
      return "16.67%";
    }

    if (status === "processing") {
      return "33.33%";
    }

    if (status === "shipped") {
      return "50%";
    }

    if (status === "out_for_delivery") {
      return "66.67%";
    }

    if (status === "delivered") {
      return "83.33%";
    }

    return "0%";
  };

  if (loading) {
    return (
      <div className="track-order-page">
        <div className="track-loading">
          Loading order tracking...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="track-order-page">
        <div className="track-error">
          <p>{error}</p>

          <button
            type="button"
            onClick={() => navigate("/myorders")}
          >
            Back to My Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="track-order-page">
      <div className="track-order-card">
        {/* Header */}
        <div className="track-header">
          <h1>Track Order</h1>

          <p>
            Ordered on{" "}
            <span>
              {formatDate(order?.createdAt)}
            </span>
            {" | "}
            Order{" "}
            <span>
              #{order?.orderId || order?._id}
            </span>
          </p>
        </div>

        {/* Main Details */}
        <div className="track-main-section">
          {/* Product */}
          <div className="track-product-section">
            <div className="track-product-image">
              {getProductImage() ? (
                <img
                  src={getProductImage()}
                  alt={getProductName()}
                />
              ) : (
                <div className="track-image-placeholder">
                  No Image
                </div>
              )}
            </div>

            <div className="track-product-details">
              <h3>{getProductName()}</h3>

              <p className="track-product-price">
                ₹{Number(selectedItem?.price || 0).toFixed(2)}
              </p>

              <p className="track-product-quantity">
                Quantity: {selectedItem?.quantity || 1}
              </p>

              <div className="track-status-row">
                <span>Status:</span>

                <strong
                  className={`track-status ${status}`}
                >
                  {status === "out_for_delivery"
                    ? "OUT FOR DELIVERY"
                    : status.toUpperCase()}
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
              <span>
                ₹
                {Number(
                  order?.subtotal ??
                    selectedItem?.price *
                      selectedItem?.quantity ??
                    0
                ).toFixed(2)}
              </span>
            </div>

            <div className="summary-row">
              <span>Total</span>
              <span>
                ₹{Number(getTotal()).toFixed(2)}
              </span>
            </div>

            <div className="summary-divider" />

            <div className="summary-total">
              <span>Grand Total</span>
              <strong>
                ₹{Number(getTotal()).toFixed(2)}
              </strong>
            </div>
          </div>
        </div>

        {/* Delivery Date */}
        {order?.deliverydate && (
          <div className="expected-delivery">
            <span>Expected Delivery</span>

            <strong>
              {formatDate(order.deliverydate)}
            </strong>
          </div>
        )}

        {/* Tracking */}
        <div className="tracking-section">
          <h3>Order Tracking</h3>

          {status === "cancelled" ? (
            <div className="cancelled-message">
              <div className="cancelled-dot" />

              <div>
                <strong>Order Cancelled</strong>

                {selectedItem?.cancelledAt && (
                  <p>
                    {formatDate(
                      selectedItem.cancelledAt
                    )}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="tracking-line-container">
                <div className="tracking-base-line" />

                <div
                  className="tracking-progress-line"
                  style={{
                    width: getProgressWidth(),
                  }}
                />

                <div className="tracking-steps">
                  {timeline.map((step) => {
                    const stepState =
                      getStepState(step.key);

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
                            <small>
                              {formatDateTime(step.date)}
                            </small>
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
                  Your order is being prepared for
                  shipment.
                </div>
              )}

              {/* Last updated */}
              <div className="tracking-last-update">
                Last updated:{" "}
                {selectedItem?.deliveredAt
                  ? formatDateTime(
                      selectedItem.deliveredAt
                    )
                  : selectedItem?.outForDeliveryAt
                  ? formatDateTime(
                      selectedItem.outForDeliveryAt
                    )
                  : selectedItem?.shippedAt
                  ? formatDateTime(
                      selectedItem.shippedAt
                    )
                  : selectedItem?.processingAt
                  ? formatDateTime(
                      selectedItem.processingAt
                    )
                  : selectedItem?.confirmedAt
                  ? formatDateTime(
                      selectedItem.confirmedAt
                    )
                  : formatDate(order?.updatedAt)}
              </div>
            </>
          )}
        </div>

        <div className="track-actions">
          <button
            type="button"
            onClick={() => navigate(-1)}
          >
            Back to My Orders
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;