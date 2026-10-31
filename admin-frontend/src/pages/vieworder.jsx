import React, {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";

import api from "../Api/axios";

import "./AdminViewOrder.css";

const AdminViewOrder = () => {
  const navigate = useNavigate();

  const { orderId } = useParams();

  const location = useLocation();

  const navigationItemId =
    location?.state?.itemId || "";

  const [order, setOrder] =
    useState(null);

  const [item, setItem] =
    useState(null);

  const [currentItemId, setCurrentItemId] =
    useState(navigationItemId);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedStatus, setSelectedStatus] =
    useState("pending");

  const [savingStatus, setSavingStatus] =
    useState(false);

  const [deliveryDate, setDeliveryDate] =
    useState("");

  const [savingDelivery, setSavingDelivery] =
    useState(false);

  const [successMessage, setSuccessMessage] =
    useState("");

  /* ==========================================
     FETCH ORDER + ITEM
     silent = true  -> reload data without the
     full page "Loading order..." screen
  ========================================== */

  const fetchOrder = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      setError("");

      const response = await api.get(
        `/admin/orders/${orderId}`
      );

      const data =
        response?.data?.data;

      const fetchedOrder =
        data?.order || null;

      const fetchedItems =
        Array.isArray(data?.items)
          ? data.items
          : [];

      if (!fetchedOrder) {
        throw new Error(
          "Order not found"
        );
      }

      /*
        Route:
        /admin/orders/vieworder/:orderId

        itemId is passed through navigation state.
        If state is missing, use the first item so the
        page still loads correctly.
      */
      const selectedItem =
        navigationItemId
          ? fetchedItems.find(
              (product) =>
                String(product?._id) ===
                String(navigationItemId)
            )
          : fetchedItems[0];

      if (!selectedItem) {
        throw new Error(
          "No order item found"
        );
      }

      setOrder(fetchedOrder);

      setItem(selectedItem);

      setCurrentItemId(
        String(selectedItem?._id || "")
      );

      const status =
        String(
          selectedItem?.status ||
            fetchedOrder?.orderstatus ||
            "confirmed"
        ).toLowerCase();

      setSelectedStatus(status);

      if (
        fetchedOrder?.deliverydate
      ) {
        const date = new Date(
          fetchedOrder.deliverydate
        );

        setDeliveryDate(
          date
            .toISOString()
            .split("T")[0]
        );
      }
    } catch (err) {
      console.error(
        "ADMIN VIEW ORDER ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load order"
      );
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId, navigationItemId]);

  /* ==========================================
     HELPERS
  ========================================== */

  const getCustomerName = () => {
    return (
      order?.userId?.FullName ||
      order?.userId?.fullName ||
      order?.userId?.name ||
      "Customer"
    );
  };

  const getPhone = () => {
    return (
      order?.userId?.MobileNumber ||
      order?.address?.phone ||
      "-"
    );
  };

  const getPaymentMethod = () => {
    const method =
      String(
        order?.paymentmethod || ""
      ).toUpperCase();

    if (method === "COD") {
      return "COD";
    }

    if (method === "ONLINE") {
      return "Online";
    }

    if (method === "WALLET") {
      return "Wallet";
    }

    return method || "-";
  };

  const getProductName = () => {
    return (
      item?.productId?.productName ||
      item?.variantId?.variantName ||
      "Product"
    );
  };

  const getProductImage = () => {
  let image =
    item?.variantId?.productImages?.[0]?.imageUrl || "";

  if (!image) return "";

  const API_ORIGIN = import.meta.env.VITE_API_BASE_URL.replace(
    /\/api\/?$/,
    ""
  );

  if (/^https?:\/\//i.test(image)) {
    if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(image)) {
      return image;
    }

    image = image.replace(
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i,
      ""
    );
  }

  image = image.replace(/^\/+/, "");

  if (image.startsWith("uploads/")) {
    return `${API_ORIGIN}/${image}`;
  }

  return `${API_ORIGIN}/uploads/${image}`;
};
  const getPrice = () => {
    return Number(
      item?.price ||
        item?.variantId?.price ||
        0
    );
  };

  const getQuantity = () => {
    return Number(
      item?.quantity || 1
    );
  };

  const getSize = () => {
    return (
      item?.variantId?.size ||
      "-"
    );
  };

  const getColor = () => {
    return (
      item?.variantId?.color ||
      "-"
    );
  };

  const getCurrentStatus = () => {
    return String(
      item?.status ||
        order?.orderstatus ||
        "pending"
    ).toLowerCase();
  };

  const getStatusLabel = (
    status
  ) => {
    return String(status)
      .replaceAll("_", " ")
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  };

  const formatDate = (
    date
  ) => {
    if (!date) {
      return "-";
    }

    return new Date(
      date
    ).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const formatOnlyDate = (
    date
  ) => {
    if (!date) {
      return "-";
    }

    return new Date(
      date
    ).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  /* ==========================================
     ACTIVE / CANCELLED / DELIVERED
  ========================================== */

  const status =
    getCurrentStatus();

  const isCancelled =
    status === "cancelled";

  const isDelivered =
    status === "delivered";

  /* ==========================================
     STATUS TIMESTAMPS
  ========================================== */

  const getStatusDate = (
    step
  ) => {
    if (!item) {
      return null;
    }

    switch (step) {
      case "order":
        return (
          order?.createdAt ||
          null
        );

      case "processing":
        return (
          item?.processingAt ||
          null
        );

      case "shipped":
        return (
          item?.shippedAt ||
          null
        );

      case "out_for_delivery":
        return (
          item?.outForDeliveryAt ||
          null
        );

      case "delivered":
        return (
          item?.deliveredAt ||
          null
        );

      case "cancelled":
        return (
          item?.cancelledAt ||
          null
        );

      default:
        return null;
    }
  };

  /* ==========================================
     TIMELINE STATUS
  ========================================== */

  const isStepCompleted = (
    step
  ) => {
    if (isCancelled) {
      const cancelDate =
        item?.cancelledAt;

      const stepDate =
        getStatusDate(step);

      if (
        step === "cancelled"
      ) {
        return true;
      }

      if (!cancelDate) {
        return false;
      }

      if (!stepDate) {
        return false;
      }

      return (
        new Date(stepDate) <=
        new Date(cancelDate)
      );
    }

    const orderFlow = [
      "pending",
      "processing",
      "shipped",
      "out_for_delivery",
      "delivered",
    ];

    const currentIndex =
      orderFlow.indexOf(
        status === "confirmed"
          ? "pending"
          : status
      );

    const stepIndex =
      orderFlow.indexOf(step);

    if (
      currentIndex === -1
    ) {
      return false;
    }

    return (
      stepIndex <=
      currentIndex
    );
  };

  /* ==========================================
     STATUS UPDATE
  ========================================== */

  const handleStatusUpdate =
    async () => {
      if (!item?._id || !currentItemId) {
        return;
      }

      try {
        setSavingStatus(true);

        setError("");

        /*
          IMPORTANT:
          This endpoint should update
          the OrderItem status.
        */

        await api.put(
          `/admin/orders/${orderId}/items/${currentItemId}/status`,
          {
            status: selectedStatus,
          }
        );

        setItem(
          (previous) => ({
            ...previous,
            status:
              selectedStatus,
          })
        );

        setSuccessMessage(
          "Status updated successfully."
        );

        // Reload the saved order/item from the server so the
        // page shows what is really stored (status + timestamps).

        await fetchOrder(true);

        if (selectedStatus === "delivered") {
          // Delivered: go back to the order page after a short pause
          // so the success message can be seen.

          setTimeout(() => {
            navigate(
              `/admin/orders/${orderId}`
            );
          }, 1200);
        } else {
          setTimeout(() => {
            setSuccessMessage("");
          }, 2500);
        }

      } catch (err) {
        console.error(
          "UPDATE ITEM STATUS ERROR:",
          err
        );

        setSuccessMessage("");

        setError(
          err?.response?.data?.message ||
            "Unable to update status"
        );
      } finally {
        setSavingStatus(false);
      }
    };

  /* ==========================================
     DELIVERY DATE
  ========================================== */

  const handleDeliverySave =
    async () => {
      if (!deliveryDate) {
        setError(
          "Please select delivery date."
        );

        return;
      }

      try {
        setSavingDelivery(true);

        setError("");

        await api.put(
          `/admin/orders/${orderId}/delivery-date`,
          {
            deliverydate:
              deliveryDate,
          }
        );

        setOrder(
          (previous) => ({
            ...previous,
            deliverydate:
              deliveryDate,
          })
        );

        setSuccessMessage(
          "Delivery date updated successfully."
        );

        setTimeout(() => {
          setSuccessMessage("");
        }, 2500);

      } catch (err) {
        console.error(
          "DELIVERY DATE ERROR:",
          err
        );

        setError(
          err?.response?.data?.message ||
            "Unable to update delivery date"
        );
      } finally {
        setSavingDelivery(false);
      }
    };

  /* ==========================================
     BACK
  ========================================== */

  const handleBack = () => {
    navigate(
      `/admin/orders/${orderId}`
    );
  };

  /* ==========================================
     LOADING
  ========================================== */

  if (loading) {
    return (
      <div className="admin-view-order-page">
        <div className="admin-view-order-loading">
          Loading order...
        </div>
      </div>
    );
  }

  /* ==========================================
     ERROR
  ========================================== */

  if (error && !order) {
    return (
      <div className="admin-view-order-page">
        <div className="admin-view-order-error">

          <h2>
            Order
          </h2>

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={handleBack}
          >
            Back
          </button>

        </div>
      </div>
    );
  }

  /* ==========================================
     RENDER
  ========================================== */

  return (
    <div className="admin-view-order-page">

      <div className="admin-view-order-container">

        {/* ==================================
            HEADER
        ================================== */}

        <div className="admin-view-order-title">

          <span>
            Order Id
          </span>

          <strong>
            #
            {order?.orderId ||
              order?._id}
          </strong>

        </div>

        {/* ==================================
            CUSTOMER SUMMARY
        ================================== */}

        <div className="admin-view-summary">

          <div>
            <span>
              customername
            </span>

            <strong>
              {getCustomerName()}
            </strong>
          </div>

          <div>
            <span>
              phone number
            </span>

            <strong>
              {getPhone()}
            </strong>
          </div>

          <div>
            <span>
              Payment method
            </span>

            <strong>
              {getPaymentMethod()}
            </strong>
          </div>

          <div>
            <span>
              order placed on
            </span>

            <strong>
              {formatDate(
                order?.createdAt
              )}
            </strong>
          </div>

          <div>
            <span>
              Total Amount
            </span>

            <strong>
              ₹
              {Number(
                order?.total || 0
              ).toLocaleString(
                "en-IN"
              )}
            </strong>
          </div>

        </div>

        {/* ==================================
            ORDER ID
        ================================== */}

        <div className="admin-view-order-id">
          Order Id :{" "}
          {order?.orderId ||
            order?._id}
        </div>

        {/* ==================================
            PRODUCT + ACTION
        ================================== */}

        <div className="admin-view-main-row">

          {/* PRODUCT */}

          <div className="admin-view-product">

            <div className="admin-view-product-image">

              {getProductImage() ? (
                <img
                  src={
                    getProductImage()
                  }
                  alt={
                    getProductName()
                  }
                />
              ) : (
                <div>
                  No Image
                </div>
              )}

            </div>

            <div className="admin-view-product-info">

              <h2>
                {getProductName()}
              </h2>

              <p>
                <span>
                  Price
                </span>
                :
                ₹
                {getPrice().toLocaleString(
                  "en-IN"
                )}
              </p>

              <p>
                <span>
                  Quantity
                </span>
                :
                {getQuantity()}
              </p>

              <p>
                <span>
                  Size
                </span>
                :
                {getSize()}
              </p>

              <p>
                <span>
                  Color
                </span>
                :
                {getColor()}
              </p>

              <p>
                <span>
                  Category
                </span>
                :
                {item?.productId
                  ?.categoryName ||
                  item?.variantId
                    ?.categoryName ||
                  "-" }
              </p>

            </div>

          </div>

          {/* ==================================
              RIGHT PANEL
          ================================== */}

          <div className="admin-view-action-panel">

            {isCancelled ? (
              <>
                <h3>
                  Order Status
                </h3>

                <div className="admin-view-cancelled-select">
                  Cancelled
                </div>

                <div className="admin-view-status-text">
                  <span>
                    Status
                  </span>

                  <strong className="cancelled">
                    Cancelled
                  </strong>
                </div>

                <div className="admin-view-status-date">

                  <strong>
                    Cancelled on
                  </strong>

                  <span>
                    {formatDate(
                      item?.cancelledAt
                    )}
                  </span>

                </div>
              </>
            ) : (
              <>
                {order?.deliverydate && (
                  <div className="admin-view-estimated-date">

                    <span>
                      Estimate Delivery on
                    </span>

                    <strong>
                      {formatOnlyDate(
                        order.deliverydate
                      )}
                    </strong>

                  </div>
                )}

                <h3>
                  Update Status
                </h3>

                <select
                  value={
                    selectedStatus
                  }
                  onChange={(e) =>
                    setSelectedStatus(
                      e.target.value
                    )
                  }
                >
                  <option value="pending">
                    Pending
                  </option>

                  <option value="confirmed">
                    Confirmed
                  </option>

                  <option value="processing">
                    Processing
                  </option>

                  <option value="shipped">
                    Shipped
                  </option>

                  <option value="out_for_delivery">
                    Out for Delivery
                  </option>

                  <option value="delivered">
                    Delivered
                  </option>
                </select>

                <button
                  type="button"
                  className="admin-view-update-button"
                  onClick={
                    handleStatusUpdate
                  }
                  disabled={
                    savingStatus
                  }
                >
                  {savingStatus
                    ? "Updating..."
                    : "Update Status"}
                </button>

                <div className="admin-view-status-text">

                  <span>
                    Status
                  </span>

                  <strong
                    className={
                      status
                    }
                  >
                    {getStatusLabel(
                      status
                    )}
                  </strong>

                </div>

                <div className="admin-view-status-date">

                  <strong>
                    {isDelivered
                      ? "Delivered on"
                      : "Updated on"}
                  </strong>

                  <span>
                    {formatDate(
                      item?.deliveredAt ||
                        item?.processingAt ||
                        item?.shippedAt ||
                        item?.outForDeliveryAt ||
                        item?.confirmedAt ||
                        order?.updatedAt
                    )}
                  </span>

                </div>

                {/* DELIVERY DATE */}

                {!isDelivered && (
                  <div className="admin-view-delivery-box">

                    <label>
                      Delivery Date
                    </label>

                    <input
                      type="date"
                      value={
                        deliveryDate
                      }
                      onChange={(e) =>
                        setDeliveryDate(
                          e.target.value
                        )
                      }
                    />

                    <button
                      type="button"
                      onClick={
                        handleDeliverySave
                      }
                      disabled={
                        savingDelivery
                      }
                    >
                      {savingDelivery
                        ? "Saving..."
                        : "Save Delivery Date"}
                    </button>

                  </div>
                )}
              </>
            )}

          </div>

        </div>

        {/* ==================================
            CANCELLED DETAILS
        ================================== */}

        {isCancelled && (
          <div className="admin-cancellation-card">

            <h3>
              Cancellation Details
            </h3>

            <div className="admin-cancellation-body">

              <p>
                <span>
                  Reason
                </span>

                <strong>
                  :
                  {item?.cancelReason ||
                    "Customer requested to cancel the product"}
                </strong>
              </p>

              <p>
                <span>
                  Cancelled By
                </span>

                <strong>
                  :
                  {item?.cancelledBy ||
                    "User"}
                </strong>
              </p>

              <p>
                <span>
                  Cancelled On
                </span>

                <strong>
                  :
                  {formatDate(
                    item?.cancelledAt
                  )}
                </strong>
              </p>

              <p>
                <span>
                  Refund Status
                </span>

                <strong>
                  :
                  {order?.paymentstatus ===
                    "paid"
                    ? "Pending"
                    : "Not Applicable"}
                </strong>
              </p>

            </div>

          </div>
        )}

        {/* ==================================
            SUCCESS
        ================================== */}

        {successMessage && (
          <div className="admin-view-success">
            {successMessage}
          </div>
        )}

        {error && order && (
          <div className="admin-view-error-message">
            {error}
          </div>
        )}

        {/* ==================================
            TIMELINE
        ================================== */}

        <div className="admin-view-timeline-section">

          <h3>
            Order Tracking Timeline
          </h3>

          <div className="admin-view-timeline">

            <div
              className={`admin-view-step ${
                isStepCompleted(
                  "order"
                )
                  ? "completed"
                  : ""
              } ${
                isCancelled
                  ? ""
                  : ""
              }`}
            >

              <div className="admin-view-circle">
                {isStepCompleted(
                  "order"
                )
                  ? "✓"
                  : "1"}
              </div>

              <span>
                Order Placed
              </span>

              <small>
                {formatDate(
                  getStatusDate(
                    "order"
                  )
                )}
              </small>

            </div>

            <div
              className={`admin-view-line ${
                isStepCompleted(
                  "processing"
                )
                  ? "completed"
                  : ""
              }`}
            />

            <div
              className={`admin-view-step ${
                isStepCompleted(
                  "processing"
                )
                  ? "completed"
                  : ""
              }`}
            >

              <div className="admin-view-circle">
                {isStepCompleted(
                  "processing"
                )
                  ? "✓"
                  : "2"}
              </div>

              <span>
                Processing
              </span>

              <small>
                {formatDate(
                  getStatusDate(
                    "processing"
                  )
                )}
              </small>

            </div>

            {isCancelled ? (
              <>
                <div
                  className={`admin-view-line cancelled-line ${
                    item?.cancelledAt
                      ? "completed"
                      : ""
                  }`}
                />

                <div className="admin-view-step cancelled-step">

                  <div className="admin-view-circle">
                    ×
                  </div>

                  <span>
                    Cancelled
                  </span>

                  <small>
                    {formatDate(
                      item?.cancelledAt
                    )}
                  </small>

                </div>

                <div className="admin-view-line" />

                <div className="admin-view-step">

                  <div className="admin-view-circle">
                    4
                  </div>

                  <span>
                    Shipped
                  </span>

                  <small>
                    -
                  </small>

                </div>

                <div className="admin-view-line" />

                <div className="admin-view-step">

                  <div className="admin-view-circle">
                    5
                  </div>

                  <span>
                    Out For Delivery
                  </span>

                  <small>
                    -
                  </small>

                </div>

                <div className="admin-view-line" />

                <div className="admin-view-step">

                  <div className="admin-view-circle">
                    6
                  </div>

                  <span>
                    Delivered
                  </span>

                  <small>
                    -
                  </small>

                </div>
              </>
            ) : (
              <>
                <div
                  className={`admin-view-line ${
                    isStepCompleted(
                      "shipped"
                    )
                      ? "completed"
                      : ""
                  }`}
                />

                <div
                  className={`admin-view-step ${
                    isStepCompleted(
                      "shipped"
                    )
                      ? "completed"
                      : ""
                  }`}
                >

                  <div className="admin-view-circle">
                    {isStepCompleted(
                      "shipped"
                    )
                      ? "✓"
                      : "3"}
                  </div>

                  <span>
                    Shipped
                  </span>

                  <small>
                    {formatDate(
                      getStatusDate(
                        "shipped"
                      )
                    )}
                  </small>

                </div>

                <div
                  className={`admin-view-line ${
                    isStepCompleted(
                      "out_for_delivery"
                    )
                      ? "completed"
                      : ""
                  }`}
                />

                <div
                  className={`admin-view-step ${
                    isStepCompleted(
                      "out_for_delivery"
                    )
                      ? "completed"
                      : ""
                  }`}
                >

                  <div className="admin-view-circle">
                    {isStepCompleted(
                      "out_for_delivery"
                    )
                      ? "✓"
                      : "4"}
                  </div>

                  <span>
                    Out For Delivery
                  </span>

                  <small>
                    {formatDate(
                      getStatusDate(
                        "out_for_delivery"
                      )
                    )}
                  </small>

                </div>

                <div
                  className={`admin-view-line ${
                    isStepCompleted(
                      "delivered"
                    )
                      ? "completed"
                      : ""
                  }`}
                />

                <div
                  className={`admin-view-step ${
                    isStepCompleted(
                      "delivered"
                    )
                      ? "completed"
                      : ""
                  }`}
                >

                  <div className="admin-view-circle">
                    {isStepCompleted(
                      "delivered"
                    )
                      ? "✓"
                      : "5"}
                  </div>

                  <span>
                    Delivered
                  </span>

                  <small>
                    {formatDate(
                      getStatusDate(
                        "delivered"
                      )
                    )}
                  </small>

                </div>
              </>
            )}

          </div>

        </div>

        {/* ==================================
            BACK
        ================================== */}

        <div className="admin-view-back">

          <button
            type="button"
            onClick={handleBack}
          >
            ← Back to Order
          </button>

        </div>

      </div>
    </div>
  );
};

export default AdminViewOrder;