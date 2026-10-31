
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../Api/axios";
import "./OrderDetail.css";

const OrderDetail = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payment, setPayment] = useState(null);

  // ==========================================
  // FETCH ORDER DETAILS
  // ==========================================

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/admin/orders/${orderId}`
      );

      const data = response?.data?.data;

      setOrder(data?.order || null);

      setItems(
        Array.isArray(data?.items) ? data.items : []
      );

      setPayment(data?.payment || null);
    } catch (err) {
      console.error("ADMIN ORDER DETAILS ERROR:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to load order details"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // USE EFFECT
  // ==========================================

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    } else {
      setError("Order ID is missing");
      setLoading(false);
    }
  }, [orderId]);

  // ==========================================
  // CUSTOMER NAME
  // ==========================================

  const getCustomerName = () => {
    return (
      order?.userId?.FullName ||
      order?.userId?.fullName ||
      order?.userId?.name ||
      "Customer"
    );
  };

  // ==========================================
  // EMAIL
  // ==========================================

  const getCustomerEmail = () => {
    return order?.userId?.email || "-";
  };

  // ==========================================
  // PHONE
  // ==========================================

  const getCustomerPhone = () => {
    return (
      order?.userId?.MobileNumber ||
      order?.userId?.mobileNumber ||
      "-"
    );
  };

  // ==========================================
  // PRODUCT IMAGE
  // ==========================================

 
    const getImage = (item) => {
  const image =
    item?.variantId?.productImages?.[0]?.imageUrl || "";

  if (!image) {
    return "";
  }

  const API_ORIGIN = import.meta.env.VITE_API_BASE_URL.replace(
    /\/api\/?$/,
    ""
  );

  if (String(image).startsWith("http")) {
    return image;
  }

  if (String(image).startsWith("/uploads/")) {
    return `${API_ORIGIN}${image}`;
  }

  return `${API_ORIGIN}/uploads/${image}`;
};
  // ==========================================
  // PRODUCT NAME
  // ==========================================

  const getProductName = (item) => {
    return (
      item?.productId?.productName ||
      item?.variantId?.variantName ||
      "Product"
    );
  };

  // ==========================================
  // PRICE
  // ==========================================

  const getPrice = (item) => {
    return Number(
      item?.price ??
        item?.variantId?.price ??
        0
    );
  };

  // ==========================================
  // QUANTITY
  // ==========================================

  const getQuantity = (item) => {
    return Number(item?.quantity ?? 1);
  };

  // ==========================================
  // ITEM STATUS
  // ==========================================

  const getItemStatus = (item) => {
    return String(
      item?.status ||
        order?.orderstatus ||
        "pending"
    ).toLowerCase();
  };

  // ==========================================
  // STATUS LABEL
  // ==========================================

  const getStatusLabel = (status) => {
    return String(status || "pending")
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  // ==========================================
  // STATUS CLASS
  // ==========================================

  const getStatusClass = (status) => {
    return `order-detail-status-${String(
      status || "pending"
    )
      .toLowerCase()
      .replaceAll("_", "-")}`;
  };

  // ==========================================
  // DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ==========================================
  // DATE + TIME
  // ==========================================

  const formatDateTime = (date) => {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ==========================================
  // PAYMENT METHOD
  // ==========================================

  const getPaymentMethod = () => {
    const method = String(
      order?.paymentmethod || ""
    ).toUpperCase();

    if (method === "COD") {
      return "Cash on Delivery";
    }

    if (method === "ONLINE") {
      return "Online";
    }

    if (method === "WALLET") {
      return "Wallet";
    }

    return method || "-";
  };

  // ==========================================
  // PAYMENT STATUS
  // ==========================================

  const getPaymentStatus = () => {
    return (
      payment?.paymentStatus ||
      order?.paymentstatus ||
      "-"
    );
  };

  // ==========================================
  // TOTAL ITEMS
  // ==========================================

  const totalItems = items.reduce(
    (total, item) =>
      total + Number(item?.quantity || 0),
    0
  );

  // ==========================================
  // ORDER STATUS
  // ==========================================

  const orderStatus = String(
    order?.orderstatus || "pending"
  ).toLowerCase();

  // ==========================================
  // VIEW ITEM
  // ==========================================

  const handleViewItem = (item) => {
    const itemId = item?._id;

    if (!itemId || !orderId) {
      return;
    }

    console.log("ADMIN ITEM DETAILS:", {
      orderId,
      itemId,
    });

    navigate(
      `/admin/orders/vieworder/${orderId}`,
      {
        state: {
          itemId,
        },
      }
    );
  };

  // ==========================================
  // BACK
  // ==========================================

  const handleBack = () => {
    navigate("/admin/orders");
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="order-detail-page">
        <div className="order-detail-loading">
          Loading order details...
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error || !order) {
    return (
      <div className="order-detail-page">
        <div className="order-detail-error">
          <h2>Order Details</h2>

          <p>{error || "Order not found"}</p>

          <button
            type="button"
            onClick={handleBack}
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <div className="order-detail-page">
      <div className="order-detail-content">

        {/* ORDER ID */}

        <div className="order-detail-heading">
          <h1>Order Id</h1>

          <h1 className="order-detail-id">
            #
            {order?.orderId ||
              order?._id ||
              "-"}
          </h1>
        </div>

        {/* PRODUCTS */}

        <div className="order-detail-products">
          {items.length > 0 ? (
            items.map((item, index) => {
              const status = getItemStatus(item);
              const image = getImage(item);
              const productName = getProductName(item);
              const price = getPrice(item);
              const quantity = getQuantity(item);

              return (
                <div
                  className="order-detail-product-row"
                  key={item?._id || index}
                >
                  {/* IMAGE */}

                  <div className="order-detail-product-image">
                    {image ? (
                      <img
                        src={image}
                        alt={productName}
                        onError={(event) => {
                          event.currentTarget.style.display =
                            "none";
                        }}
                      />
                    ) : (
                      <div className="order-detail-no-image">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* PRODUCT INFO */}

                  <div className="order-detail-product-info">
                    <h3>{productName}</h3>

                    <p>
                      ₹{" "}
                      {price.toLocaleString("en-IN")}
                    </p>

                    <p>
                      Quantity: {quantity}
                    </p>

                    <p>
                      Order Id:{" "}
                      {order?.orderId || order?._id}
                    </p>
                  </div>

                  {/* STATUS AND ACTION */}

                  <div className="order-detail-product-action">
                    <div className="order-detail-status-line">
                      <span>Status:</span>

                      <span
                        className={getStatusClass(status)}
                      >
                        {getStatusLabel(status)}
                      </span>
                    </div>

                    <div>
                      <span>Payment Status:</span>

                      <strong
                        className={getStatusClass(
                          payment?.paymentStatus ||
                            order?.paymentstatus ||
                            "pending"
                        )}
                      >
                        {getStatusLabel(
                          payment?.paymentStatus ||
                            order?.paymentstatus ||
                            "pending"
                        )}
                      </strong>
                    </div>

                    <button
                      type="button"
                      className="order-detail-view-button"
                      onClick={() =>
                        handleViewItem(item)
                      }
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="order-detail-no-items">
              No products found.
            </div>
          )}
        </div>

        {/* INFORMATION CARDS */}

        <div className="order-detail-info-grid">

          {/* ORDER DETAILS */}

          <div className="order-detail-card">
            <h3>ORDER DETAILS</h3>

            <div className="order-detail-card-body">
              <div>
                <span>Order Date:</span>

                <strong>
                  {formatDateTime(order?.createdAt)}
                </strong>
              </div>

              <div>
                <span>Order Status:</span>

                <strong>
                  {getStatusLabel(orderStatus)}
                </strong>
              </div>

              <div>
                <span>Payment Status:</span>

                <strong>
                  {getPaymentStatus()}
                </strong>
              </div>

              <div>
                <span>Payment Type:</span>

                <strong>
                  {getPaymentMethod()}
                </strong>
              </div>

              <div>
                <span>Total Items:</span>

                <strong>{totalItems}</strong>
              </div>

              <div>
                <span>Total Amount:</span>

                <strong>
                  ₹{" "}
                  {Number(
                    order?.total || 0
                  ).toLocaleString("en-IN")}
                </strong>
              </div>
            </div>
          </div>

          {/* PERSONAL INFO */}

          <div className="order-detail-card">
            <h3>PERSONAL INFO</h3>

            <div className="order-detail-card-body">
              <div>
                <span>User Name:</span>

                <strong>{getCustomerName()}</strong>
              </div>

              <div>
                <span>Email:</span>

                <strong>{getCustomerEmail()}</strong>
              </div>

              <div>
                <span>Phone:</span>

                <strong>{getCustomerPhone()}</strong>
              </div>

              <div>
                <span>Registered On:</span>

                <strong>
                  {formatDate(
                    order?.userId?.createdAt
                  )}
                </strong>
              </div>
            </div>
          </div>

          {/* ADDRESS */}

          <div className="order-detail-card">
            <h3>ADDRESS</h3>

            <div className="order-detail-address">
              <p>
                Name:{" "}
                {order?.address?.name ||
                  getCustomerName()}
              </p>

              <p>
                Address:{" "}
                {order?.address?.address || "-"}
              </p>

              <p>
                {order?.address?.pincode || "-"}
              </p>

              <p>
                Phone: {getCustomerPhone()}
              </p>
            </div>
          </div>
        </div>

        {/* BACK BUTTON */}

        <div className="order-detail-back-area">
          <button
            type="button"
            onClick={handleBack}
            className="order-detail-back-button"
          >
            Back to Orders
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
