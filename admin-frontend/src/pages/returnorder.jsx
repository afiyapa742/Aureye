import React, { useEffect, useMemo, useState } from "react";

import api from "../Api/axios";

import SuccessPopup from "../combonent/successpop";

import "./returnorders.css";



const ReturnOrder = () => {

  const [requests, setRequests] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");

  const [actionPopup, setActionPopup] = useState(null);

  const [collectPopup, setCollectPopup] = useState(null);

  const [refundPopup, setRefundPopup] = useState(null);

  const [errorPopup, setErrorPopup] = useState("");

  const [successPopup, setSuccessPopup] = useState({ show: false, message: "" });

  const [processing, setProcessing] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);



  const ITEMS_PER_PAGE = 10;



  // Loads every backend page so the frontend can paginate all records.

  const fetchAllReturns = async () => {

    const limit = 100;

    const maxPages = 50;

    let page = 1;

    const collected = [];

    const seen = new Set();



    while (page <= maxPages) {

      const response = await api.get("/admin/returns", {

        params: { page, limit },

      });



      const batch = Array.isArray(response.data?.data)

        ? response.data.data

        : [];



      let added = 0;

      batch.forEach((item) => {

        const key = item?._id || JSON.stringify(item);

        if (!seen.has(key)) {

          seen.add(key);

          collected.push(item);

          added += 1;

        }

      });



      const apiTotalPages = Number(

        response.data?.totalPages ||

          response.data?.pagination?.totalPages ||

          response.data?.pages ||

          1

      );



      if (batch.length === 0 || added === 0 || page >= apiTotalPages) break;



      page += 1;

    }



    return collected;

  };



  const fetchReturns = async () => {

    try {

      setLoading(true);



      const data = await fetchAllReturns();



      // This page is only for delivered-product returns.

      const deliveredReturns = data.filter(

        (item) =>

          ["return_requested", "return_approved", "returned"].includes(

            String(item?.status || "").toLowerCase()

          ) &&

          String(item?.orderId?.orderstatus || "").toLowerCase() === "delivered"

      );



      console.log("RETURNS RAW vs FILTERED:", data.length, deliveredReturns.length);



      setRequests(deliveredReturns);

    } catch (error) {

      console.error("ADMIN RETURN REQUEST ERROR:", error);

      setErrorPopup(

        error?.response?.data?.message || "Failed to load return requests"

      );

    } finally {

      setLoading(false);

    }

  };



  useEffect(() => {

    fetchReturns();

  }, []);



  const getProductImage = (request) => {
  let image =
    request?.variantId?.productImages?.[0]?.imageUrl ||
    request?.variantId?.productImages?.[0]?.image ||
    request?.variantId?.productImages?.[0]?.url ||
    request?.productId?.productImages?.[0]?.imageUrl ||
    request?.productId?.productImages?.[0]?.image ||
    request?.productId?.image ||
    request?.productId?.images?.[0] ||
    request?.productId?.productImage ||
    request?.productId?.thumbnail ||
    request?.variantId?.image ||
    request?.variantId?.images?.[0] ||
    request?.variantId?.productImage ||
    request?.variantId?.thumbnail ||
    request?.productImage ||
    request?.image ||
    "";

  if (typeof image === "object" && image !== null) {
    image =
      image.url ||
      image.imageUrl ||
      image.path ||
      image.filename ||
      image.fileName ||
      image.location ||
      "";
  }

  if (!image) return "/images/no-image.png";

  let imageString = String(image).trim();

  if (!imageString) return "/images/no-image.png";

  if (/^https?:\/\//i.test(imageString)) {
    if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(imageString)) {
      return imageString;
    }

    imageString = imageString.replace(
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i,
      ""
    );
  }

  imageString = imageString.replace(/^\/+/, "");

  const API_ORIGIN = import.meta.env.VITE_API_BASE_URL.replace(
    /\/api\/?$/,
    ""
  );

  if (
    imageString.startsWith("uploads/") ||
    imageString.startsWith("images/") ||
    imageString.startsWith("product-images/") ||
    imageString.startsWith("products/") ||
    imageString.startsWith("upload/")
  ) {
    return `${API_ORIGIN}/${imageString}`;
  }

  return `${API_ORIGIN}/uploads/${imageString}`;
};


  const handleImageError = (e) => {

    if (!e.currentTarget.dataset.fallback) {

      e.currentTarget.dataset.fallback = "true";

      e.currentTarget.src = "/images/no-image.png";

    }

  };



  const getProductName = (request) =>

    request?.productId?.name ||

    request?.productId?.productName ||

    request?.productId?.title ||

    request?.productName ||

    "Product";



  const getCustomerName = (request) =>

    request?.orderId?.userId?.name ||

    request?.orderId?.userId?.username ||

    request?.orderId?.userId?.email ||

    "Customer";



  const getCustomerEmail = (request) =>

    request?.orderId?.userId?.email || "";



  const getOrderId = (request) =>

    request?.orderId?._id || request?.orderId || "";



  const getShortOrderId = (request) => {

    const id = getOrderId(request);

    return id ? `#${String(id).slice(-8).toUpperCase()}` : "N/A";

  };



  const getPaymentMethod = (request) =>

    String(

      request?.orderId?.paymentmethod ||

        request?.orderId?.paymentMethod ||

        ""

    ).toUpperCase();



  const getOrderStatus = (request) =>

    String(request?.orderId?.orderstatus || "").toLowerCase();



  // IMPORTANT: refund amount is the exact amount actually paid.

  const getRefundAmount = (request) => {
    const orderTotal = Number(request?.orderId?.total || 0);
    return Number.isFinite(orderTotal) && orderTotal > 0
      ? Math.round(orderTotal * 100) / 100
      : 0;
  };



  const formatMoney = (amount) =>

    `₹${Number(amount || 0).toLocaleString("en-IN")}`;



  const getStatusText = (request) => {

    if (request?.status === "return_requested") return "Pending";

    if (request?.status === "return_approved") return "Accepted";

    if (request?.status === "returned") return "Returned";

    return request?.status || "Unknown";

  };



  const isDeliveredReturn = (request) =>

    request?.status === "return_requested" &&

    getOrderStatus(request) === "delivered";



  const isRefundEligible = (request) =>

    request?.status === "returned" &&

    !!(request?.returnReceivedAt || request?.returnedAt) &&

    request?.refundStatus !== "REFUNDED";



  const getRefundInfo = (request) => {

    if (request?.refundStatus === "REFUNDED") {

      return { type: "completed", text: "✓ Refunded to wallet" };

    }



    if (request?.status === "returned" && isRefundEligible(request)) {

      return { type: "ready", text: "Refund ready" };

    }



    if (request?.status === "return_approved") {

      return { type: "waiting", text: "Waiting for product" };

    }



    if (request?.status === "return_requested") {

      return { type: "waiting", text: "Accept return request" };

    }



    return { type: "none", text: "-" };

  };



  const filteredRequests = useMemo(() => {

    const keyword = search.toLowerCase().trim();



    return requests.filter((request) => {

      const orderId = String(getOrderId(request)).toLowerCase();

      const customer = String(getCustomerName(request)).toLowerCase();

      const product = String(getProductName(request)).toLowerCase();



      const matchesSearch =

        !keyword ||

        orderId.includes(keyword) ||

        customer.includes(keyword) ||

        product.includes(keyword);



      const matchesStatus =

        statusFilter === "all" ||

        request?.status === statusFilter;



      return matchesSearch && matchesStatus;

    });

  }, [requests, search, statusFilter]);



  useEffect(() => {

    setCurrentPage(1);

  }, [search, statusFilter]);



  const totalPages = Math.max(

    1,

    Math.ceil(filteredRequests.length / ITEMS_PER_PAGE)

  );



  useEffect(() => {

    if (currentPage > totalPages) setCurrentPage(totalPages);

  }, [currentPage, totalPages]);



  const paginatedRequests = filteredRequests.slice(

    (currentPage - 1) * ITEMS_PER_PAGE,

    currentPage * ITEMS_PER_PAGE

  );



  // Windowed page numbers: 1 ... 4 5 6 ... 20

  const getPageNumbers = () => {

    if (totalPages <= 5) {

      return Array.from({ length: totalPages }, (_, i) => i + 1);

    }



    const pages = [1];

    const start = Math.max(2, currentPage - 1);

    const end = Math.min(totalPages - 1, currentPage + 1);



    if (start > 2) pages.push("start-ellipsis");



    for (let i = start; i <= end; i++) {

      pages.push(i);

    }



    if (end < totalPages - 1) pages.push("end-ellipsis");



    pages.push(totalPages);



    return pages;

  };



  const pageNumbers = getPageNumbers();



  const pendingRequests = filteredRequests.filter(

    (item) => item.status === "return_requested"

  ).length;



  const approvedRequests = filteredRequests.filter(

    (item) => item.status === "return_approved"

  ).length;



  const refundReady = filteredRequests.filter(

    (item) => isRefundEligible(item)

  ).length;



  const openAcceptPopup = (request) => setActionPopup(request);



  const confirmAccept = async () => {

    if (!actionPopup) return;



    try {

      setProcessing(true);



      await api.put(`/admin/returns/${actionPopup._id}/status`, {

        status: "return_approved",

      });



      setActionPopup(null);

      await fetchReturns();



      setSuccessPopup({

        show: true,

        message:

          "Return request accepted successfully. Customer can now return the product.",

      });

    } catch (error) {

      console.error("ACCEPT RETURN ERROR:", error);

      setActionPopup(null);

      setErrorPopup(

        error?.response?.data?.message ||

          "Failed to accept return request."

      );

    } finally {

      setProcessing(false);

    }

  };



  const openCollectPopup = (request) => setCollectPopup(request);



  const confirmCollected = async () => {

    if (!collectPopup) return;



    try {

      setProcessing(true);



      await api.put(`/admin/returns/${collectPopup._id}/received`);



      setCollectPopup(null);

      await fetchReturns();



      setSuccessPopup({

        show: true,

        message:

          "Product collected successfully. Refund is now ready.",

      });

    } catch (error) {

      console.error("COLLECT RETURN ERROR:", error);

      setCollectPopup(null);

      setErrorPopup(

        error?.response?.data?.message ||

          "Failed to mark product as collected."

      );

    } finally {

      setProcessing(false);

    }

  };



  const openRefundPopup = (request) => {

    if (!isRefundEligible(request)) {

      setErrorPopup("This refund is not eligible yet.");

      return;

    }



    const amount = getRefundAmount(request);



    if (amount <= 0) {

      setErrorPopup(

        "Actual amount paid is not available for this order item."

      );

      return;

    }



    setRefundPopup({

      ...request,

      refundAmount: amount,

    });

  };



  const processRefund = async () => {

    if (!refundPopup) return;



    try {

      setProcessing(true);



      const response = await api.put(

        `/admin/returns/${refundPopup._id}/refund`

      );



      const refundedAmount = Number(

        response?.data?.refundAmount ??

          response?.data?.data?.refundAmount ??

          refundPopup?.refundAmount ??

          0

      );



      setRefundPopup(null);

      await fetchReturns();



      setSuccessPopup({

        show: true,

        message: `${formatMoney(

          refundedAmount

        )} has been added to the customer's wallet successfully.`,

      });

    } catch (error) {

      console.error("REFUND ERROR:", error);

      setRefundPopup(null);

      setErrorPopup(

        error?.response?.data?.message ||

          "Refund failed. Please try again."

      );

    } finally {

      setProcessing(false);

    }

  };



  return (

    <div className="return-page">

      <div className="return-header">

        <div>

          <h1>Returns & Refunds Management</h1>

          <p>Manage delivered product returns and customer refunds</p>

        </div>

      </div>



      <div className="return-stats">

        <div className="return-stat-card">

          <div className="stat-icon blue">↩</div>

          <div>

            <span>Total Returns</span>

            <strong>{filteredRequests.length}</strong>

          </div>

        </div>



        <div className="return-stat-card">

          <div className="stat-icon orange">⏳</div>

          <div>

            <span>Pending</span>

            <strong>{pendingRequests}</strong>

          </div>

        </div>



        <div className="return-stat-card">

          <div className="stat-icon green">✓</div>

          <div>

            <span>Accepted</span>

            <strong>{approvedRequests}</strong>

          </div>

        </div>



        <div className="return-stat-card">

          <div className="stat-icon purple">₹</div>

          <div>

            <span>Refund Ready</span>

            <strong>{refundReady}</strong>

          </div>

        </div>

      </div>



      <div className="return-filter">

        <div className="search-box">

          <span>⌕</span>

          <input

            type="text"

            placeholder="Search order, customer or product..."

            value={search}

            onChange={(e) => setSearch(e.target.value)}

          />

        </div>



        <select

          value={statusFilter}

          onChange={(e) => setStatusFilter(e.target.value)}

        >

          <option value="all">All Status</option>

          <option value="return_requested">Pending</option>

          <option value="return_approved">Accepted</option>

          <option value="returned">Returned</option>

        </select>

      </div>



      <div className="return-table-wrapper">

        <table className="return-table">

          <thead>

            <tr>

              <th>#</th>

              <th>ORDER ID</th>

              <th>CUSTOMER</th>

              <th>PRODUCT</th>

              <th>REASON</th>

              <th>PAYMENT</th>

              <th>DELIVERY</th>

              <th>STATUS</th>

              <th>REFUND</th>

              <th>ACTION</th>

            </tr>

          </thead>



          <tbody>

            {loading ? (

              <tr>

                <td colSpan="10" className="empty-row">

                  Loading...

                </td>

              </tr>

            ) : paginatedRequests.length === 0 ? (

              <tr>

                <td colSpan="10" className="empty-row">

                  No return requests found

                </td>

              </tr>

            ) : (

              paginatedRequests.map((request, index) => {

                const refundIsReady = isRefundEligible(request);

                const actualRefund = getRefundAmount(request);

                const refundInfo = getRefundInfo(request);



                return (

                  <tr key={request._id}>

                    <td>

                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}

                    </td>



                    <td>

                      <strong>{getShortOrderId(request)}</strong>

                    </td>



                    <td>

                      <div className="customer-cell">

                        <strong>{getCustomerName(request)}</strong>

                        <span>{getCustomerEmail(request)}</span>

                      </div>

                    </td>



                    <td>

                      <div className="product-cell">

                        <img

                          src={getProductImage(request)}

                          alt={getProductName(request)}

                          onError={handleImageError}

                        />



                        <div>

                          <strong>{getProductName(request)}</strong>

                          <span>

                            Qty: {request.quantity || 1}

                          </span>

                        </div>

                      </div>

                    </td>



                    <td>

                      <span className="reason-text">

                        {request.returnReason || "No reason"}

                      </span>

                    </td>



                    <td>

                      <span

                        className={`payment-badge ${getPaymentMethod(

                          request

                        ).toLowerCase()}`}

                      >

                        {getPaymentMethod(request) || "N/A"}

                      </span>

                    </td>



                    <td>

                      <span className="delivery-badge delivered">

                        Delivered

                      </span>

                    </td>



                    <td>

                      <span

                        className={`return-status ${request.status}`}

                      >

                        {getStatusText(request)}

                      </span>

                    </td>



                    <td>

                      <div className="refund-cell">

                        {refundInfo.type === "completed" && (

                          <span className="refund-completed">

                            ✓ Refunded

                          </span>

                        )}



                        {refundInfo.type === "waiting" && (

                          <span className="refund-waiting">

                            {refundInfo.text}

                          </span>

                        )}



                        {refundInfo.type === "ready" && (

                          <div>

                            <span className="refund-ready-text">

                              Refund ready

                            </span>

                            <strong>

                              {formatMoney(actualRefund)}

                            </strong>

                          </div>

                        )}

                      </div>

                    </td>



                    <td>

                      <div className="action-buttons">

                        {isDeliveredReturn(request) && (

                          <button

                            className="accept-btn"

                            onClick={() => openAcceptPopup(request)}

                          >

                            Accept

                          </button>

                        )}



                        {request.status === "return_approved" && (

                          <button

                            className="accept-btn"

                            onClick={() => openCollectPopup(request)}

                          >

                            Collected

                          </button>

                        )}



                        {request.status === "returned" &&

                          refundIsReady && (

                            <button

                              className="refund-btn"

                              onClick={() => openRefundPopup(request)}

                            >

                              Refund

                            </button>

                          )}

                      </div>

                    </td>

                  </tr>

                );

              })

            )}

          </tbody>

        </table>

      </div>



      {!loading && filteredRequests.length > 0 && (

        <div className="return-pagination">

          <span className="pagination-info">

            Showing{" "}

            {(currentPage - 1) * ITEMS_PER_PAGE + 1}-

            {Math.min(

              currentPage * ITEMS_PER_PAGE,

              filteredRequests.length

            )}{" "}

            of {filteredRequests.length}

          </span>



          <div className="pagination-buttons">

            <button

              type="button"

              disabled={currentPage === 1}

              onClick={() => setCurrentPage((p) => p - 1)}

            >

              Previous

            </button>



            {pageNumbers.map((page) =>

              typeof page === "string" ? (

                <span key={page} className="pagination-dots">

                  ...

                </span>

              ) : (

                <button

                  type="button"

                  key={page}

                  className={currentPage === page ? "active" : ""}

                  onClick={() => setCurrentPage(page)}

                >

                  {page}

                </button>

              )

            )}



            <button

              type="button"

              disabled={currentPage === totalPages}

              onClick={() => setCurrentPage((p) => p + 1)}

            >

              Next

            </button>

          </div>

        </div>

      )}



      {actionPopup && (

        <div className="modal-overlay">

          <div className="action-modal">

            <button

              className="modal-close"

              onClick={() => setActionPopup(null)}

            >

              ×

            </button>



            <div className="modal-heading">

              <div className="accept-icon">✓</div>

              <h2>Accept Return Request</h2>

              <p>

                Confirm that you want to accept this return request.

              </p>

            </div>



            <div className="modal-product">

              <img

                src={getProductImage(actionPopup)}

                alt="product"

                onError={handleImageError}

              />



              <div>

                <h3>{getProductName(actionPopup)}</h3>

                <p>Qty: {actionPopup.quantity || 1}</p>

              </div>

            </div>



            <div className="modal-details">

              <div>

                <span>Order ID</span>

                <strong>{getShortOrderId(actionPopup)}</strong>

              </div>



              <div>

                <span>Customer</span>

                <strong>{getCustomerName(actionPopup)}</strong>

              </div>



              <div>

                <span>Payment</span>

                <strong>{getPaymentMethod(actionPopup)}</strong>

              </div>



              <div>

                <span>Actual Amount Paid</span>

                <strong>

                  {formatMoney(getRefundAmount(actionPopup))}

                </strong>

              </div>

            </div>



            <div className="return-notice">

              <span>⏳</span>

              <p>

                This product was already delivered. After accepting,

                the customer must return the product. Once received,

                the Refund button will become available.

              </p>

            </div>



            <p className="confirm-text">

              Are you sure you want to accept this return request?

            </p>



            <div className="modal-actions">

              <button

                className="cancel-btn"

                onClick={() => setActionPopup(null)}

                disabled={processing}

              >

                Cancel

              </button>



              <button

                className="sure-accept-btn"

                onClick={confirmAccept}

                disabled={processing}

              >

                {processing ? "Processing..." : "Sure, Accept"}

              </button>

            </div>

          </div>

        </div>

      )}



      {collectPopup && (

        <div className="modal-overlay">

          <div className="action-modal">

            <button

              className="modal-close"

              onClick={() => setCollectPopup(null)}

            >

              ×

            </button>



            <div className="modal-heading">

              <div className="accept-icon">✓</div>

              <h2>Confirm Product Collected</h2>

              <p>

                Confirm that the returned product has been physically

                received.

              </p>

            </div>



            <div className="modal-product">

              <img

                src={getProductImage(collectPopup)}

                alt="product"

                onError={handleImageError}

              />



              <div>

                <h3>{getProductName(collectPopup)}</h3>

                <p>Qty: {collectPopup.quantity || 1}</p>

              </div>

            </div>



            <div className="modal-details">

              <div>

                <span>Order ID</span>

                <strong>{getShortOrderId(collectPopup)}</strong>

              </div>



              <div>

                <span>Customer</span>

                <strong>{getCustomerName(collectPopup)}</strong>

              </div>



              <div>

                <span>Payment</span>

                <strong>{getPaymentMethod(collectPopup)}</strong>

              </div>



              <div>

                <span>Refund Amount</span>

                <strong>

                  {formatMoney(getRefundAmount(collectPopup))}

                </strong>

              </div>

            </div>



            <div className="return-notice">

              <span>✓</span>

              <p>

                After confirming that the product was collected, it

                will be marked as returned and the Refund button will

                become available.

              </p>

            </div>



            <p className="confirm-text">

              Have you received the returned product from the customer?

            </p>



            <div className="modal-actions">

              <button

                className="cancel-btn"

                onClick={() => setCollectPopup(null)}

                disabled={processing}

              >

                Cancel

              </button>



              <button

                className="sure-accept-btn"

                onClick={confirmCollected}

                disabled={processing}

              >

                {processing ? "Processing..." : "Yes, Collected"}

              </button>

            </div>

          </div>

        </div>

      )}



      {refundPopup && (

        <div className="modal-overlay">

          <div className="action-modal refund-modal">

            <button

              className="modal-close"

              onClick={() => setRefundPopup(null)}

            >

              ×

            </button>



            <div className="refund-title">

              <div className="wallet-icon">₹</div>

              <h2>Confirm Refund</h2>

              <p>Money will be added to customer's wallet.</p>

            </div>



            <div className="modal-product">

              <img

                src={getProductImage(refundPopup)}

                alt="product"

                onError={handleImageError}

              />



              <div>

                <h3>{getProductName(refundPopup)}</h3>

                <p>Qty: {refundPopup.quantity || 1}</p>

              </div>

            </div>



            <div className="refund-summary">

              <div>

                <span>Order ID</span>

                <strong>{getShortOrderId(refundPopup)}</strong>

              </div>



              <div>

                <span>Payment</span>

                <strong>{getPaymentMethod(refundPopup)}</strong>

              </div>



              <div>

                <span>Actual Amount Paid</span>

                <strong className="refund-amount">

                  {formatMoney(getRefundAmount(refundPopup))}

                </strong>

              </div>

            </div>



            <div className="refund-price-notice">

              <span>✓</span>

              <p>

                This is the amount the customer actually paid after

                applicable product offers and coupon discounts.

              </p>

            </div>



            <div className="wallet-notice">

              <span>✓</span>

              <p>

                The refund will be credited to the customer's wallet.

              </p>

            </div>



            <p className="confirm-text">

              Are you sure you want to process this refund?

            </p>



            <div className="modal-actions">

              <button

                className="cancel-btn"

                onClick={() => setRefundPopup(null)}

                disabled={processing}

              >

                Cancel

              </button>



              <button

                className="sure-refund-btn"

                onClick={processRefund}

                disabled={processing}

              >

                {processing ? "Processing..." : "Sure, Refund"}

              </button>

            </div>

          </div>

        </div>

      )}



      {errorPopup && (

        <div className="modal-overlay">

          <div className="error-modal">

            <button

              className="modal-close"

              onClick={() => setErrorPopup("")}

            >

              ×

            </button>



            <div className="error-icon">×</div>

            <h2>Refund Failed</h2>

            <p>{errorPopup}</p>



            <button

              className="error-ok-btn"

              onClick={() => setErrorPopup("")}

            >

              OK

            </button>

          </div>

        </div>

      )}



      {successPopup.show && (

        <SuccessPopup

          message={successPopup.message}

          onClose={() =>

            setSuccessPopup({

              show: false,

              message: "",

            })

          }

        />

      )}

    </div>

  );

};



export default ReturnOrder;