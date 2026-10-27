import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import API from "../Api/axios"
import "./Orders.css";

const AdminOrders = () => {
  const navigate = useNavigate();

  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [sortBy, setSortBy] =
    useState("date-desc");

  const [currentPage, setCurrentPage] =
    useState(1);

  const itemsPerPage = 5;

  /* ==========================================
     GET ORDERS FROM DATABASE
  ========================================== */

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await API.get(
          "/admin/orders"
        );

      const orderList =
        response?.data?.data || [];

      setOrders(orderList);
      setCurrentPage(1);

    } catch (err) {
      console.error(
        "ADMIN ORDERS ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Unable to load orders"
      );

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);


  /* ==========================================
     SHORT ORDER ID
     Display only 5 numeric digits.
  ========================================== */

  const getShortOrderId = (order) => {
    const existingOrderNumber =
      order?.orderNumber ||
      order?.orderId;

    if (
      existingOrderNumber !==
        undefined &&
      existingOrderNumber !== null
    ) {
      const digits = String(
        existingOrderNumber
      ).replace(/\D/g, "");

      if (digits) {
        return digits
          .slice(-5)
          .padStart(5, "0");
      }
    }

    const mongoId = String(
      order?._id || ""
    );

    if (!mongoId) {
      return "00000";
    }

    /*
     * Convert the last 8 hex characters
     * of MongoDB ObjectId to a 5-digit
     * numeric display ID.
     */
    const hexPart =
      mongoId.slice(-8);

    const numericValue =
      Number.parseInt(
        hexPart,
        16
      ) || 0;

    return String(
      numericValue % 100000
    ).padStart(5, "0");
  };

  /* ==========================================
     STATUS
  ========================================== */

  const getStatus = (order) => {
    return String(
      order?.displayStatus ||
        order?.orderstatus ||
        "pending"
    ).toLowerCase();
  };

  /* ==========================================
     COUNTS
  ========================================== */

  const totalOrders =
    orders.length;

  const pendingOrders =
    orders.filter(
      (order) =>
        getStatus(order) ===
        "pending"
    ).length;

  const cancelledOrders =
    orders.filter(
      (order) =>
        getStatus(order) ===
          "cancelled" ||
        getStatus(order) ===
          "partially_cancelled"
    ).length;


  /* ==========================================
     DATE
  ========================================== */

  const getTime = (date) => {
    if (!date) {
      return 0;
    }

    return new Date(date).getTime() || 0;
  };

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  };


  /* ==========================================
     CUSTOMER
  ========================================== */

  const getCustomerName = (order) => {
    return (
      order?.userId?.FullName ||
      order?.userId?.fullName ||
      order?.userId?.name ||
      "Customer"
    );
  };

  const getCustomerEmail = (order) => {
    return (
      order?.userId?.email ||
      "-"
    );
  };


  /* ==========================================
     PAYMENT
  ========================================== */

  const getPaymentLabel = (order) => {
    const paymentMethod =
      String(
        order?.paymentmethod || ""
      ).toUpperCase();

    const labels = {
      COD: "Cash on Delivery",
      ONLINE: "Online Payment",
      WALLET: "Wallet",
    };

    return (
      labels[paymentMethod] ||
      order?.paymentmethod ||
      "-"
    );
  };


  /* ==========================================
     SEARCH + FILTER + SORT
  ========================================== */

  const filteredOrders = useMemo(() => {
    const searchText =
      search.trim().toLowerCase();

    let result = orders.filter(
      (order) => {
        const orderId =
          getShortOrderId(
            order
          ).toLowerCase();

        const customerName =
          getCustomerName(order)
            .toLowerCase();

        const customerEmail =
          getCustomerEmail(order)
            .toLowerCase();

        const payment =
          String(
            order?.paymentmethod || ""
          ).toLowerCase();

        const status =
          getStatus(order);

        const matchesSearch =
          !searchText ||
          orderId.includes(searchText) ||
          customerName.includes(searchText) ||
          customerEmail.includes(searchText) ||
          payment.includes(searchText) ||
          status.includes(searchText);

        let matchesFilter = true;

        if (
          statusFilter === "Completed"
        ) {
          matchesFilter =
            status === "delivered";
        } else if (
          statusFilter ===
          "Cancelled"
        ) {
          matchesFilter =
            status ===
              "cancelled" ||
            status ===
              "partially_cancelled";
        } else if (
          statusFilter !== "All"
        ) {
          matchesFilter =
            status ===
            statusFilter.toLowerCase();
        }

        return (
          matchesSearch &&
          matchesFilter
        );
      }
    );

    result = [...result].sort(
      (a, b) => {
        if (sortBy === "date-desc") {
          return (
            getTime(b?.createdAt) -
            getTime(a?.createdAt)
          );
        }

        if (sortBy === "date-asc") {
          return (
            getTime(a?.createdAt) -
            getTime(b?.createdAt)
          );
        }

        if (sortBy === "amount-high") {
          return (
            Number(b?.total || 0) -
            Number(a?.total || 0)
          );
        }

        if (sortBy === "amount-low") {
          return (
            Number(a?.total || 0) -
            Number(b?.total || 0)
          );
        }

        if (
          sortBy === "customer-az"
        ) {
          return getCustomerName(
            a
          ).localeCompare(
            getCustomerName(b)
          );
        }

        return 0;
      }
    );

    return result;
  }, [
    orders,
    search,
    statusFilter,
    sortBy,
  ]);


  /* ==========================================
     PAGINATION
  ========================================== */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredOrders.length /
        itemsPerPage
    )
  );

  const safePage = Math.min(
    currentPage,
    totalPages
  );

  const currentOrders =
    filteredOrders.slice(
      (safePage - 1) *
        itemsPerPage,
      safePage * itemsPerPage
    );

  const changePage = (page) => {
    if (
      page < 1 ||
      page > totalPages
    ) {
      return;
    }

    setCurrentPage(page);
  };


  /* ==========================================
     SEARCH
  ========================================== */

  const handleSearch = (event) => {
    setSearch(
      event.target.value
    );

    setCurrentPage(1);
  };


  /* ==========================================
     FILTER
  ========================================== */

  const handleFilter = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };


  /* ==========================================
     SORT
  ========================================== */

  const handleSort = (event) => {
    setSortBy(
      event.target.value
    );

    setCurrentPage(1);
  };


  /* ==========================================
     CLEAR
  ========================================== */

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setSortBy("date-desc");
    setCurrentPage(1);
  };


  /* ==========================================
     EXPORT
  ========================================== */

  const handleExport = () => {
    if (
      filteredOrders.length === 0
    ) {
      return;
    }

    const headers = [
      "Order ID",
      "Customer",
      "Email",
      "Total",
      "Payment",
      "Status",
      "Date",
    ];

    const rows =
      filteredOrders.map(
        (order) => [
          getShortOrderId(order),
          getCustomerName(order),
          getCustomerEmail(order),
          Number(
            order?.total || 0
          ).toFixed(2),
          getPaymentLabel(order),
          getStatus(order),
          formatDate(
            order?.createdAt
          ),
        ]
      );

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) =>
            `"${String(
              value
            ).replaceAll(
              '"',
              '""'
            )}"`
          )
          .join(",")
      )
      .join("\n");

    const blob =
      new Blob(
        [csv],
        {
          type:
            "text/csv;charset=utf-8;",
        }
      );

    const url =
      window.URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href = url;
    link.download =
      "orders.csv";

    document.body.appendChild(
      link
    );

    link.click();

    link.remove();

    window.URL.revokeObjectURL(
      url
    );
  };


  /* ==========================================
     VIEW DETAILS
  ========================================== */

  const handleViewDetails = (
    order
  ) => {
    const id = order?._id;

    if (!id) {
      console.error(
        "ADMIN ORDER ID NOT FOUND:",
        order
      );
      return;
    }

    navigate(
      `/admin/orders/${id}`
    );
  };


  /* ==========================================
     LOADING
  ========================================== */

  if (loading) {
    return (
      <div className="admin-orders-page">
        <div className="admin-orders-loading">
          Loading orders...
        </div>
      </div>
    );
  }


  /* ==========================================
     ERROR
  ========================================== */

  if (error) {
    return (
      <div className="admin-orders-page">
        <div className="admin-orders-error">
          <h2>
            Unable to Load Orders
          </h2>

          <p>{error}</p>

          <button
            type="button"
            onClick={fetchOrders}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }


  /* ==========================================
     UI
  ========================================== */

  return (
    <div className="admin-orders-page">
      <div className="admin-orders-container">

        {/* ==========================================
            PAGE TITLE
        ========================================== */}

       
<div className="admin-orders-header">
  <h1>Orders</h1>

  <button
    type="button"
    className="admin-sales-report-button"
    onClick={() => navigate("/admin/sales-report")}
  >
    Sales Report
  </button>
</div>



        {/* ==========================================
            STAT CARDS
        ========================================== */}

        <div className="admin-order-stats">

          <div className="admin-order-stat-card">
            <span className="admin-order-stat-title">
              Total Orders
            </span>

            <strong className="admin-order-stat-value">
              {totalOrders}
            </strong>
          </div>

          <div className="admin-order-stat-card">
            <span className="admin-order-stat-title">
              Pending Orders
            </span>

            <strong className="admin-order-stat-value">
              {pendingOrders}
            </strong>
          </div>

          <div className="admin-order-stat-card">
            <span className="admin-order-stat-title">
              Cancelled Orders
            </span>

            <strong className="admin-order-stat-value">
              {cancelledOrders}
            </strong>
          </div>

        </div>


        {/* ==========================================
            TOOLBAR
        ========================================== */}

        <div className="admin-orders-toolbar">

          <div className="admin-order-status-tabs">

            <button
              type="button"
              className={`admin-order-status-tab ${
                statusFilter === "Completed"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handleFilter(
                  "Completed"
                )
              }
            >
              Completed
            </button>

            <button
              type="button"
              className={`admin-order-status-tab pending ${
                statusFilter === "Pending"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handleFilter(
                  "Pending"
                )
              }
            >
              Pending
            </button>

            <button
              type="button"
              className={`admin-order-status-tab cancelled ${
                statusFilter === "Cancelled"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handleFilter(
                  "Cancelled"
                )
              }
            >
              Cancelled
            </button>

          </div>


          <div className="admin-order-tools">

            <div className="admin-order-search">
              <span className="admin-order-search-icon">
                ⌕
              </span>

              <input
                type="text"
                value={search}
                onChange={
                  handleSearch
                }
                placeholder="Search orders..."
              />
            </div>


            <div className="admin-order-filter-box">

              <span className="admin-order-filter-label">
                Filter By
              </span>

              <select
                value={sortBy}
                onChange={
                  handleSort
                }
                aria-label="Sort orders"
              >
                <option value="date-desc">
                  Latest Date
                </option>

                <option value="date-asc">
                  Oldest Date
                </option>

                <option value="amount-high">
                  Amount High to Low
                </option>

                <option value="amount-low">
                  Amount Low to High
                </option>

                <option value="customer-az">
                  Customer A-Z
                </option>
              </select>

            </div>


            <button
              type="button"
              className="admin-order-clear-button"
              onClick={
                clearFilters
              }
            >
              Clear
            </button>


            <button
              type="button"
              className="admin-order-export-button"
              onClick={
                handleExport
              }
            >
              Export
            </button>

          </div>

        </div>


        {/* ==========================================
            ORDER TABLE
        ========================================== */}

        <div className="admin-orders-table-wrapper">

          <table className="admin-orders-table">

            <thead>
              <tr>
                <th>
                  Order ID
                </th>

                <th>
                  Customer
                </th>

                <th>
                  Total
                </th>

                <th>
                  Payment
                </th>

                <th>
                  Status
                </th>

                <th>
                  Date
                </th>

                <th>
                  Action
                </th>
              </tr>
            </thead>


            <tbody>

              {currentOrders.length >
              0 ? (

                currentOrders.map(
                  (order) => {

                    const status =
                      getStatus(
                        order
                      );

                    return (
                      <tr
                        key={
                          order?._id
                        }
                      >

                        <td className="admin-order-id">
                          #
                          {getShortOrderId(
                            order
                          )}
                        </td>


                        <td>
                          <div className="admin-customer-cell">
                            <span className="admin-customer-name">
                              {getCustomerName(
                                order
                              )}
                            </span>
                          </div>
                        </td>


                        <td>
                          ₹
                          {Number(
                            order?.total ||
                              0
                          ).toLocaleString(
                            "en-IN",
                            {
                              minimumFractionDigits:
                                2,
                              maximumFractionDigits:
                                2,
                            }
                          )}
                        </td>


                        <td>
                          {getPaymentLabel(
                            order
                          )}
                        </td>


                        <td>
                          <span
                            className={`admin-order-status-badge ${status
                              .replaceAll(
                                "_",
                                "-"
                              )}`}
                          >
                            {status ===
                            "out_for_delivery"
                              ? "Out for Delivery"
                              : status ===
                                  "partially_cancelled"
                                ? "Partially Cancelled"
                                : status.charAt(0).toUpperCase() +
                                  status.slice(1)}
                          </span>
                        </td>


                        <td>
                          {formatDate(
                            order?.createdAt
                          )}
                        </td>


                        <td>
                          <button
                            type="button"
                            className="admin-order-view-button"
                            onClick={() =>
                              handleViewDetails(
                                order
                              )
                            }
                          >
                            <span className="admin-order-view-icon">
                              ⌕
                            </span>

                            View
                          </button>
                        </td>

                      </tr>
                    );
                  }
                )

              ) : (

                <tr>
                  <td
                    colSpan="7"
                    className="admin-orders-empty"
                  >
                    No orders found.
                  </td>
                </tr>

              )}

            </tbody>

          </table>

        </div>


        {/* ==========================================
            PAGINATION
        ========================================== */}

        <div className="admin-orders-pagination">

          <button
            type="button"
            onClick={() =>
              changePage(
                safePage - 1
              )
            }
            disabled={
              safePage === 1
            }
          >
            Previous
          </button>


          {Array.from(
            {
              length:
                totalPages,
            },
            (_, index) =>
              index + 1
          ).map((page) => (

            <button
              type="button"
              key={page}
              className={
                safePage ===
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

          ))}


          <button
            type="button"
            onClick={() =>
              changePage(
                safePage + 1
              )
            }
            disabled={
              safePage ===
              totalPages
            }
          >
            Next
          </button>

        </div>

      </div>


      {/* ==========================================
          FOOTER
      ========================================== */}

      <footer className="admin-orders-footer">
        © 2026 All rights reserved.
      </footer>

    </div>
  );
};

export default AdminOrders;
