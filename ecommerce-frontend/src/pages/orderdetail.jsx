import React, { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import API from "../api/axios";

import "./OrderDetails.css";


const OrderDetails = () => {

  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [showCancelPopup, setShowCancelPopup] = useState(false);

  const [selectedCancelItem, setSelectedCancelItem] = useState(null);

  const [cancelReason, setCancelReason] = useState("");

  const [cancelling, setCancelling] = useState(false);

  const [showCancelSuccess, setShowCancelSuccess] = useState(false);

  const [showCancelValidation, setShowCancelValidation] = useState(false);

  const [cancelValidationMessage, setCancelValidationMessage] = useState("");
  const [showInvoicePopup, setShowInvoicePopup] = useState(false);
  const [invoicePdfUrl, setInvoicePdfUrl] = useState("");
  const [showMessagePopup, setShowMessagePopup] = useState(false);
  const [messagePopupTitle, setMessagePopupTitle] = useState("Notice");
  const [messagePopupMessage, setMessagePopupMessage] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 3;

  const showMessage = (title, message) => {
    setMessagePopupTitle(title);
    setMessagePopupMessage(message);
    setShowMessagePopup(true);
  };

  const fetchMyOrders = async () => {

    try {

      setLoading(true);

      setError("");

      const response = await API.get("/myorder");

      console.log("MY ORDER RESPONSE:", response.data);

      const orderList = response.data?.data || [];

      console.log("ORDERS WITH ITEMS:", orderList);

      setOrders(orderList);

      setCurrentPage(1);

    } catch (err) {

      console.error("MY ORDER ERROR:", err);

      setError(

        err?.response?.data?.message ||

          "Unable to load orders"

      );

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    fetchMyOrders();

  }, []);

  const getImage = (item) => {
  const image =
    item?.variantId?.productImages?.[0]?.imageUrl || "";

  if (!image) return "";

import.meta.env.VITE_API_BASE_URL ||
  "https://aureyaforwomen.shop/api";

const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

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
const getName = (item) => {
  return (
    item?.variantId?.productId?.productName ||
    item?.variantId?.productId?.name ||
    item?.productName ||
    item?.product?.name ||
    item?.name ||
    "Product"
  );
};
  /* ==========================================

     PRICE

  ========================================== */

  const getPrice = (item) => {

    return Number(item?.price || 0);

  };

  /* ==========================================

     QUANTITY

  ========================================== */

  const getQuantity = (item) => {

    return Number(item?.quantity || 1);

  };

  /* ==========================================

     CUSTOMER PAID AMOUNT

  ========================================== */

  const getOrderSubtotal = (order) => {

    return Number(order?.subtotal || 0);

  };

  const getOrderDiscount = (order) => {

    return Number(order?.discountamount || 0);

  };

  const getOrderDeliveryCharge = (order) => {

    const delivery = Number(order?.deliverycharge);

    return Number.isFinite(delivery)

      ? delivery

      : 50;

  };

  const getOrderTax = (order) => {

    const subtotal = getOrderSubtotal(order);

    return Number((subtotal * 0.05).toFixed(2));

  };

  const getCustomerPaidAmount = (order) => {

    const subtotal = getOrderSubtotal(order);

    const discount = getOrderDiscount(order);

    const delivery = getOrderDeliveryCharge(order);

    const tax = getOrderTax(order);

    return Number(

      (

        subtotal -

        discount +

        delivery +

        tax

      ).toFixed(2)

    );

  };

  /* ==========================================

     STATUS

  ========================================== */

const getStatus = (item, currentOrder) => {
  return String(
    currentOrder?.orderstatus ||
      item?.status ||
      "pending"
  ).toLowerCase();
};


  const statusLabel = (status) => {

    return status

      .replaceAll("_", " ")

      .toUpperCase();

  };

  /* ==========================================

     DATE

  ========================================== */

  const formatDate = (date) => {

    if (!date) {

      return "-";

    }

    return new Date(date).toLocaleDateString(

      "en-GB",

      {

        day: "2-digit",

        month: "long",

        year: "numeric",

      }

    );

  };

  /* ==========================================

     ORDERS PAGINATION

  ========================================== */

  const ordersPerPage = 3;

  const totalPages = Math.ceil(

    orders.length / ordersPerPage

  );

  const startIndex =

    (currentPage - 1) * ordersPerPage;

  const currentOrders = orders.slice(

    startIndex,

    startIndex + ordersPerPage

  );

  /* ==========================================

     ORDER HELPERS

  ========================================== */

  const getOrderDisplayId = (order) => {

    return (

      order?.orderId ||

      order?._id ||

      order?.id ||

      "-"

    );

  };

  const getOrderItems = (order) => {

    return Array.isArray(order?.items)

      ? order.items

      : [];

  };

  const canCancelItem = (item) => {

    const itemStatus = getStatus(

      item,

      null

    );

    return [

      "confirmed",

      "processing",

      "shipped",

    ].includes(itemStatus);

  };

  const canReturnItem = (item) => {

    const itemStatus = getStatus(

      item,

      null

    );

    if (itemStatus !== "delivered") {

      return false;

    }

    if (!item?.deliveredAt) {

      return false;

    }

    const deliveredAt = new Date(

      item.deliveredAt

    ).getTime();

    if (Number.isNaN(deliveredAt)) {

      return false;

    }

    const returnDeadline =

      deliveredAt +

      9 * 24 * 60 * 60 * 1000;

    return Date.now() <= returnDeadline;

  };

  const handleViewAllOrder = (orderId) => {

    if (!orderId) {

      return;

    }

    navigate("/viewdetails", {

      state: {

        orderId,

        viewAll: true,

      },

    });

  };

  /* ==========================================

     PAGE CHANGE

  ========================================== */

  const changePage = (page) => {

    if (

      page < 1 ||

      page > totalPages

    ) {

      return;

    }

    setCurrentPage(page);

    window.scrollTo({

      top: 0,

      behavior: "smooth",

    });

  };

  /* ==========================================

     PAGE NUMBERS

  ========================================== */

  const getPageNumbers = () => {

    if (totalPages <= 5) {

      return Array.from(

        {

          length: totalPages,

        },

        (_, index) => index + 1

      );

    }

    if (currentPage <= 3) {

      return [

        1,

        2,

        3,

        "...",

        totalPages,

      ];

    }

    if (

      currentPage >=

      totalPages - 2

    ) {

      return [

        1,

        "...",

        totalPages - 2,

        totalPages - 1,

        totalPages,

      ];

    }

    return [

      1,

      "...",

      currentPage,

      "...",

      totalPages,

    ];

  };

  /* ==========================================

     TRACK PRODUCT

  ========================================== */

  const handleTrack = (

    item,

    orderId

  ) => {

    const itemId =

      item?._id ||

      item?.id;

    if (!itemId || !orderId) {

      return;

    }

    navigate("/viewdetails", {

      state: {

        orderId,

        itemId,

      },

    });

  };

  /* ==========================================

     OPEN CANCEL POPUP

  ========================================== */

  const openCancelPopup = (item) => {

    setSelectedCancelItem(item);

    setCancelReason("");

    setShowCancelPopup(true);

  };

  /* ==========================================

     CLOSE CANCEL POPUP

  ========================================== */

  const closeCancelPopup = () => {

    if (cancelling) {

      return;

    }

    setShowCancelPopup(false);

    setSelectedCancelItem(null);

    setCancelReason("");

  };

  /* ==========================================

     CONFIRM CANCEL

  ========================================== */

  const confirmCancel = async () => {

    const itemId =

      selectedCancelItem?._id ||

      selectedCancelItem?.id;

    if (!itemId) {

      return;

    }

    const reason = cancelReason.trim();

    if (!reason) {

      setCancelValidationMessage(

        "Please provide a valid cancellation reason before proceeding."

      );

      setShowCancelValidation(true);

      return;

    }

    if (reason.length < 10) {

      setCancelValidationMessage(

        "Please provide a more detailed cancellation reason."

      );

      setShowCancelValidation(true);

      return;

    }

    try {

      setCancelling(true);

      console.log(

        "CANCELLING ITEM:",

        itemId

      );

      await API.put(

        `/myorder/order-item/cancel/${itemId}`,

        {

          reason,

        }

      );

      console.log(

        "ORDER CANCEL SUCCESS"

      );

      setShowCancelPopup(false);

      setSelectedCancelItem(null);

      setCancelReason("");

      await fetchMyOrders();

      setShowCancelSuccess(true);

    } catch (err) {

      console.error(

        "CANCEL ITEM ERROR:",

        err

      );

      showMessage("Cancellation Error", err?.response?.data?.message || "Unable to cancel product");

    } finally {

      setCancelling(false);

    }

  };

  /* ==========================================

     CLOSE SUCCESS POPUP

  ========================================== */

  const closeSuccessPopup = () => {

    setShowCancelSuccess(false);

  };

  /* ==========================================

     RETURN

  ========================================== */

  const handleReturn = (

    item,

    orderId

  ) => {

    handleTrack(

      item,

      orderId

    );

  };

  /* ==========================================

     INVOICE

  ========================================== */

  const handleInvoice = async (orderId, itemId) => {
    if (!orderId || !itemId) return;

    try {
      const response = await API.get(
        `/myorder/order/${orderId}/invoice/${itemId}`,
        { responseType: "blob" }
      );
      const contentType = response.headers?.["content-type"] || "";

      if (!contentType.toLowerCase().includes("application/pdf")) {
        let errorMessage = "The server did not return a PDF invoice.";
        try {
          const errorText = await response.data.text();
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Keep the default message if the response is not JSON.
        }
        showMessage("Invoice Error", errorMessage);
        return;
      }

      const pdfBlob = new Blob([response.data], { type: "application/pdf" });
      const pdfUrl = window.URL.createObjectURL(pdfBlob);
      if (invoicePdfUrl) window.URL.revokeObjectURL(invoicePdfUrl);
      setInvoicePdfUrl(pdfUrl);
      setShowInvoicePopup(true);
    } catch (error) {
      console.error("INVOICE ERROR:", error);
      showMessage(
        "Invoice Error",
        error?.response?.data?.message || "Unable to open invoice. Please try again."
      );
    }
  };

  const closeInvoicePopup = () => {
    setShowInvoicePopup(false);
    if (invoicePdfUrl) window.URL.revokeObjectURL(invoicePdfUrl);
    setInvoicePdfUrl("");
  };

  const closeMessagePopup = () => setShowMessagePopup(false);

  if (loading) {

    return (

      <div className="order-details-page">

        <div className="order-details-loading">

          Loading order details...

        </div>

      </div>

    );

  }

  /* ==========================================

     ERROR

  ========================================== */

  if (error) {

    return (

      <div className="order-details-page">

        <div className="order-details-error">

          <h2>

            Orders not found

          </h2>

          <p>

            {error}

          </p>

          <button

            onClick={() =>

              navigate("/home")

            }

          >

            Back to Home

          </button>

        </div>

      </div>

    );

  }

  /* ==========================================

     NO ORDERS

  ========================================== */

  if (orders.length === 0) {

    return (

      <div className="order-details-page">

        <div className="order-details-error">

          <h2>

            No Orders Found

          </h2>

          <p>

            You have not placed any

            orders yet.

          </p>

          <button

            onClick={() =>

              navigate("/home")

            }

          >

            Continue Shopping

          </button>

        </div>

      </div>

    );

  }

  /* ==========================================

     UI

  ========================================== */

  return (

    <div className="order-details-page">

      {/* HEADER */}

      <div className="order-details-header">

        <h1>

          My Orders

        </h1>

        <button

          className="back-orders-button"

          onClick={() =>

            navigate("/home")

          }

        >

          Back to Home

        </button>

      </div>

      {/* ORDERS */}

      <div className="order-details-orders">

        {currentOrders.map(

          (

            order,

            orderIndex

          ) => {

            const orderId =

              order?._id ||

              order?.id;

            const orderItems =

              getOrderItems(order);

            const orderHasManyItems =

              orderItems.length > 1;

            return (

              <div

                className="order-details-card"

                key={

                  orderId ||

                  `order-${orderIndex}`

                }

              >

                {/* ORDER HEADER */}

                <div className="order-card-header">

                  <div>

                    <span className="order-card-label">

                      Order Id

                    </span>

                    <strong className="order-card-id">

                      #

                      {

                        getOrderDisplayId(

                          order

                        )

                      }

                    </strong>

                    <span className="order-card-date">

                      Order Date :{" "}

                      {formatDate(

                        order?.createdAt

                      )}

                    </span>

                  </div>

                  {orderHasManyItems && (

                    <button

                      type="button"

                      className="view-all-order-button"

                      onClick={() =>

                        handleViewAllOrder(

                          orderId

                        )

                      }

                    >

                      View All Items

                    </button>

                  )}

                </div>

                {/* ORDER ITEMS */}

                <div className="order-card-items">

                  {orderItems.length > 0 ? (

                    orderItems.map(

                      (

                        item,

                        itemIndex

                      ) => {

                        const status =

                          getStatus(

                            item,

                            order

                          );

                        const price =

                          getPrice(item);

                        const quantity =

                          getQuantity(item);

                        const itemSubtotal =

                          price * quantity;

                        const orderSubtotal =

                          getOrderSubtotal(

                            order

                          );

                        const couponDiscount =

                          Number(

                            order?.coupondiscount ||

                              0

                          );

                        const itemCouponDiscount =

                          orderSubtotal > 0

                            ? (itemSubtotal /

                                orderSubtotal) *

                              couponDiscount

                            : 0;

                        const itemTotal =

                          Math.max(

                            0,

                            itemSubtotal -

                              itemCouponDiscount

                          );

                        const itemId =

                          item?._id ||

                          item?.id;

                        return (

                          <div

                            className="order-detail-product"

                            key={

                              itemId ||

                              `${orderId}-${itemIndex}`

                            }

                          >

                            {/* PRODUCT IMAGE */}

                            <div className="order-detail-image">

                              {getImage(item) ? (

                                <img

                                  src={getImage(item)}

                                  alt={getName(item)}

                                />

                              ) : (

                                <div className="order-detail-no-image">

                                  No Image

                                </div>

                              )}

                            </div>

                            {/* PRODUCT INFORMATION */}

                            <div className="order-detail-product-info">

                              <h3>

                                {getName(item)}

                              </h3>

                              <p>

                                ₹{" "}

                                {price.toLocaleString(

                                  "en-IN"

                                )}

                              </p>

                              <p>

                                Quantity :{" "}

                                {quantity}

                              </p>

                              {item?.variantId?.size && (

                                <p>

                                  Size :{" "}

                                  {

                                    item

                                      .variantId

                                      .size

                                  }

                                </p>

                              )}

                              {/* ITEM TOTAL */}

                              <p>

                                Item Total : ₹{" "}

                                {itemTotal.toLocaleString(

                                  "en-IN"

                                )}

                              </p>

                            </div>

                            {/* STATUS + ACTIONS */}

                            <div className="order-detail-actions">

                              <div className="detail-status">

                                Status :{" "}

                                <span

                                  className={`detail-status-${status}`}

                                >

                                  {statusLabel(

                                    status

                                  )}

                                </span>

                              </div>

                              <div className="detail-buttons">

                                {/* RETURN */}

                                {canReturnItem(

                                  item

                                ) && (

                                  <button

                                    type="button"

                                    className="detail-return-button"

                                    onClick={() =>

                                      handleReturn(

                                        item,

                                        orderId

                                      )

                                    }

                                  >

                                    🛍 Return

                                  </button>

                                )}

                                {/* INVOICE */}

                                {status !==

                                  "cancelled" && (

                                  <button

                                    type="button"

                                    className="detail-invoice-button"

                                    onClick={() =>

                                      handleInvoice(

                                        orderId,

                                        itemId

                                      )

                                    }

                                  >

                                    ↓ Invoice

                                  </button>

                                )}

                                {/* VIEW DETAILS */}

                                <button

                                  type="button"

                                  className="detail-view-button"

                                  onClick={() =>

                                    handleTrack(

                                      item,

                                      orderId

                                    )

                                  }

                                >

                                  View Details

                                </button>

                                {/* CANCEL */}

                                {status !==

                                  "cancelled" &&

                                  status !==

                                    "delivered" &&

                                  status !==

                                    "shipped" && (

                                  <button

                                    type="button"

                                    className="detail-cancel-button"

                                    onClick={() =>

                                      openCancelPopup(

                                        item

                                      )

                                    }

                                  >

                                    Cancel Order

                                  </button>

                                )}

                              </div>

                              <div className="detail-delivery">

                                {status ===

                                "delivered"

                                  ? `Delivered ${formatDate(

                                      item?.deliveredAt ||

                                        order?.deliverydate ||

                                        order?.updatedAt

                                    )}`

                                  : status ===

                                    "cancelled"

                                  ? "Order Cancelled"

                                  : order?.deliverydate

                                  ? `Expect Delivery on ${formatDate(

                                      order.deliverydate

                                    )}`

                                  : "Expect Delivery Soon"}

                              </div>

                            </div>

                          </div>

                        );

                      }

                    )

                  ) : (

                    <div className="order-details-no-items">

                      No items found for this order.

                    </div>

                  )}

                </div>

                {/* ORDER SUMMARY */}

              </div>

            );

          }

        )}

        {/* PAGINATION */}

        {totalPages > 1 && (

          <div className="order-details-pagination">

            <button

              type="button"

              onClick={() =>

                changePage(

                  currentPage - 1

                )

              }

              disabled={

                currentPage === 1

              }

            >

              ‹

            </button>

            {getPageNumbers().map(

              (

                page,

                index

              ) => {

                if (

                  page === "..."

                ) {

                  return (

                    <span

                      key={

                        `dots-${index}`

                      }

                    >

                      ...

                    </span>

                  );

                }

                return (

                  <button

                    type="button"

                    key={page}

                    className={

                      currentPage ===

                      page

                        ? "active"

                        : ""

                    }

                    onClick={() =>

                      changePage(

                        page

                      )

                    }

                  >

                    {page}

                  </button>

                );

              }

            )}

            <button

              type="button"

              onClick={() =>

                changePage(

                  currentPage + 1

                )

              }

              disabled={

                currentPage ===

                totalPages

              }

            >

              ›

            </button>

          </div>

        )}

      </div>

      {/* CANCEL CONFIRMATION POPUP */}

      {showCancelPopup && (

        <div

          className="cancel-popup-overlay"

          onClick={

            closeCancelPopup

          }

        >

          <div

            className="cancel-popup"

            onClick={(e) =>

              e.stopPropagation()

            }

          >

            <div className="cancel-popup-icon">

              !

            </div>

            <h2>

              Cancel Order?

            </h2>

            <p className="cancel-popup-message">

              Are you sure you want to

              cancel this order?

            </p>

            {selectedCancelItem && (

              <p className="cancel-product-name">

                {getName(

                  selectedCancelItem

                )}

              </p>

            )}

            <label

              htmlFor="cancelReason"

            >

              Cancellation reason

              <span>

                *

              </span>

            </label>

            <textarea

              id="cancelReason"

              name="cancelReason"

              value={cancelReason}

              onChange={(e) =>

                setCancelReason(

                  e.target.value

                )

              }

              placeholder="Please provide your cancellation reason..."

              rows={3}

              disabled={cancelling}

            />

            <div className="cancel-popup-buttons">

              <button

                type="button"

                className="cancel-keep-button"

                onClick={

                  closeCancelPopup

                }

                disabled={

                  cancelling

                }

              >

                No, Keep Order

              </button>

              <button

                type="button"

                className="cancel-confirm-button"

                onClick={

                  confirmCancel

                }

                disabled={

                  cancelling

                }

              >

                {cancelling

                  ? "Cancelling..."

                  : "Yes, Cancel Order"}

              </button>

            </div>

          </div>

        </div>

      )}

      {/* CANCEL VALIDATION POPUP */}

      {showCancelValidation && (

        <div

          className="cancel-popup-overlay"

          onClick={() =>

            setShowCancelValidation(

              false

            )

          }

        >

          <div

            className="cancel-popup"

            onClick={(e) =>

              e.stopPropagation()

            }

          >

            <div className="cancel-popup-icon">

              !

            </div>

            <h2>

              Reason Required

            </h2>

            <p className="cancel-popup-message">

              {

                cancelValidationMessage

              }

            </p>

            <div className="cancel-popup-buttons">

              <button

                type="button"

                className="cancel-confirm-button"

                onClick={() =>

                  setShowCancelValidation(

                    false

                  )

                }

              >

                OK

              </button>

            </div>

          </div>

        </div>

      )}

      {/* CANCEL SUCCESS POPUP */}

      {showCancelSuccess && (

        <div className="cancel-popup-overlay">

          <div

            className="cancel-success-popup"

            onClick={(e) =>

              e.stopPropagation()

            }

          >

            <div className="cancel-success-icon">

              ✓

            </div>

            <h2>

              Cancellation Successful

            </h2>

            <p className="cancel-success-message">

              Your order has been cancelled

              successfully.

            </p>

            <button

              type="button"

              className="cancel-success-ok-button"

              onClick={

                closeSuccessPopup

              }

            >

              OK

            </button>

          </div>

        </div>

      )}

      {/* INVOICE PDF POPUP */}
      {showInvoicePopup && invoicePdfUrl && (
        <div className="invoice-popup-overlay" onClick={closeInvoicePopup}>
          <div className="invoice-popup" onClick={(e) => e.stopPropagation()}>
            <div className="invoice-popup-header">
              <h2>Order Invoice</h2>
              <button type="button" className="invoice-popup-close" onClick={closeInvoicePopup} aria-label="Close invoice">×</button>
            </div>
            <iframe className="invoice-pdf-frame" src={invoicePdfUrl} title="Order Invoice" />
            <div className="invoice-popup-footer">
              <a href={invoicePdfUrl} download="order-invoice.pdf" className="invoice-download-button">Download Invoice</a>
              <button type="button" className="invoice-close-button" onClick={closeInvoicePopup}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM MESSAGE POPUP */}
      {showMessagePopup && (
        <div className="invoice-popup-overlay" onClick={closeMessagePopup}>
          <div className="message-popup" onClick={(e) => e.stopPropagation()}>
            <div className="message-popup-icon">!</div>
            <h2>{messagePopupTitle}</h2>
            <p>{messagePopupMessage}</p>
            <button type="button" className="message-popup-button" onClick={closeMessagePopup}>OK</button>
          </div>
        </div>
      )}

    </div>

  );

};

export default OrderDetails;
