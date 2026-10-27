import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../Api/axios";
import "./Coupon.css";

const Coupon = () => {
  const navigate = useNavigate();

  const [coupons, setCoupons] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [showFilter, setShowFilter] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // DELETE POPUP
  // ==========================================

  const [deletePopup, setDeletePopup] = useState({
    show: false,
    couponId: null,
  });

  // ==========================================
  // RESULT POPUP
  // ==========================================

  const [popup, setPopup] = useState({
    show: false,
    type: "",
    title: "",
    message: "",
  });

  // ==========================================
  // FETCH COUPONS
  // ==========================================

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/coupons");

      console.log("COUPONS RESPONSE:", response.data);

      if (response.data.success) {
        setCoupons(response.data.data || []);
      } else {
        setError(
          response.data.message ||
            "Failed to fetch coupons"
        );
      }
    } catch (error) {
      console.error(
        "FETCH COUPONS ERROR:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Something went wrong while fetching coupons"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FETCH WHEN PAGE LOADS
  // ==========================================

  useEffect(() => {
    fetchCoupons();
  }, []);

  // ==========================================
  // GET DYNAMIC STATUS
  // ==========================================

  const getCouponStatus = (coupon) => {
    const now = new Date();

    const startDate = new Date(
      coupon.valid_from
    );

    const endDate = new Date(
      coupon.valid_to
    );

    if (coupon.status === "inactive") {
      return "Inactive";
    }

    if (now < startDate) {
      return "Scheduled";
    }

    if (now > endDate) {
      return "Expired";
    }

    return "Active";
  };

  // ==========================================
  // TOTAL
  // ==========================================

  const totalCoupons = coupons.length;

  // ==========================================
  // ACTIVE
  // ==========================================

  const activeCoupons = coupons.filter(
    (coupon) =>
      getCouponStatus(coupon) === "Active"
  ).length;

  // ==========================================
  // EXPIRED
  // ==========================================

  const expiredCoupons = coupons.filter(
    (coupon) =>
      getCouponStatus(coupon) === "Expired"
  ).length;

  // ==========================================
  // SCHEDULED
  // ==========================================

  const scheduledCoupons = coupons.filter(
    (coupon) =>
      getCouponStatus(coupon) === "Scheduled"
  ).length;

  // ==========================================
  // FILTER COUPONS
  // ==========================================

  const filteredCoupons =
    activeFilter === "All"
      ? coupons
      : coupons.filter(
          (coupon) =>
            getCouponStatus(coupon) ===
            activeFilter
        );

  // ==========================================
  // EDIT COUPON
  // ==========================================

  const handleEdit = (coupon) => {
    console.log("EDIT COUPON:", coupon);
    console.log(
      "EDIT COUPON ID:",
      coupon?._id
    );

    if (!coupon || !coupon._id) {
      setError("Coupon ID not found");
      return;
    }

    navigate(
      `/admin/coupon/edit/${coupon._id}`
    );
  };

  // ==========================================
  // OPEN DELETE POPUP
  // ==========================================

  const handleDelete = (couponId) => {
    console.log(
      "DELETE COUPON ID:",
      couponId
    );

    if (!couponId) {
      setPopup({
        show: true,
        type: "error",
        title: "Error",
        message: "Coupon ID not found.",
      });

      return;
    }

    setDeletePopup({
      show: true,
      couponId: couponId,
    });
  };

  // ==========================================
  // CLOSE DELETE POPUP
  // ==========================================

  const closeDeletePopup = () => {
    setDeletePopup({
      show: false,
      couponId: null,
    });
  };

  // ==========================================
  // CONFIRM DELETE
  // ==========================================

  const confirmDelete = async () => {
    const couponId =
      deletePopup.couponId;

    if (!couponId) {
      closeDeletePopup();

      setPopup({
        show: true,
        type: "error",
        title: "Error",
        message: "Coupon ID not found.",
      });

      return;
    }

    try {
      console.log(
        "DELETING COUPON ID:",
        couponId
      ); 2 

      const response = await api.delete(
        `/admin/coupons/${couponId}`
      );

      console.log(
        "DELETE COUPON RESPONSE:",
        response.data
      );

      if (response.data.success) {
        // Remove deleted coupon immediately
        setCoupons((prevCoupons) =>
          prevCoupons.filter(
            (coupon) =>
              coupon._id !== couponId
          )
        );

        // Close delete popup
        closeDeletePopup();

        // Show success popup
        setPopup({
          show: true,
          type: "success",
          title: "Success",
          message:
            "Coupon deleted successfully.",
        });
      } else {
        closeDeletePopup();

        setPopup({
          show: true,
          type: "error",
          title: "Error",
          message:
            response.data.message ||
            "Failed to delete coupon.",
        });
      }
    } catch (error) {
      console.error(
        "DELETE COUPON ERROR:",
        error
      );

      closeDeletePopup();

      setPopup({
        show: true,
        type: "error",
        title: "Error",
        message:
          error.response?.data?.message ||
          "Failed to delete coupon.",
      });
    }
  };

  // ==========================================
  // CLOSE RESULT POPUP
  // ==========================================

  const closePopup = () => {
    setPopup({
      show: false,
      type: "",
      title: "",
      message: "",
    });
  };

  // ==========================================
  // ADD COUPON
  // ==========================================

  const handleAddCoupon = () => {
    navigate("/admin/coupon/add");
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) return "-";

    const formattedDate =
      new Date(date);

    if (
      isNaN(formattedDate.getTime())
    ) {
      return "-";
    }

    return formattedDate.toLocaleDateString(
      "en-GB"
    );
  };

  // ==========================================
  // DISCOUNT DISPLAY
  // ==========================================

  const displayDiscount = (coupon) => {
    if (
      coupon.discounttype ===
      "percentage"
    ) {
      return `${coupon.discountvalue}%`;
    }

    return `₹${coupon.discountvalue}`;
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="coupon-page">

        <div className="coupon-loading">
          Loading coupons...
        </div>

      </div>
    );
  }

  // ==========================================
  // RETURN
  // ==========================================

  return (
    <div className="coupon-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="coupon-header">

        <div>
          <h1>Coupons</h1>
        </div>

        <button
          className="add-coupon-main-btn"
          onClick={handleAddCoupon}
        >
          + ADD COUPON
        </button>

      </div>

      {/* =====================================
          ERROR
      ===================================== */}

      {error && (
        <div className="coupon-error">

          <span>{error}</span>

          <button onClick={fetchCoupons}>
            Retry
          </button>

        </div>
      )}

      {/* =====================================
          STATISTICS
      ===================================== */}

      <div className="coupon-stat-container">

        <div className="coupon-stat-card">
          <span>Total Coupons</span>

          <strong>
            {totalCoupons}
          </strong>
        </div>

        <div className="coupon-stat-card">
          <span>Active Coupons</span>

          <strong>
            {activeCoupons}
          </strong>
        </div>

        <div className="coupon-stat-card">
          <span>Expired Coupons</span>

          <strong>
            {expiredCoupons}
          </strong>
        </div>

      </div>

      {/* =====================================
          TOOLBAR
      ===================================== */}

      <div className="coupon-toolbar">

        {/* STATUS FILTER */}

        <div className="coupon-status-tabs">

          <button
            className={
              activeFilter === "All"
                ? "active-tab"
                : ""
            }
            onClick={() =>
              setActiveFilter("All")
            }
          >
            All
          </button>

          <button
            className={
              activeFilter === "Active"
                ? "active-tab"
                : ""
            }
            onClick={() =>
              setActiveFilter("Active")
            }
          >
            Active
          </button>

          <button
            className={
              activeFilter === "Expired"
                ? "active-tab"
                : ""
            }
            onClick={() =>
              setActiveFilter("Expired")
            }
          >
            Expired
          </button>

          <button
            className={
              activeFilter === "Scheduled"
                ? "active-tab"
                : ""
            }
            onClick={() =>
              setActiveFilter("Scheduled")
            }
          >
            Scheduled
          </button>

        </div>

        {/* RIGHT SIDE */}

        <div className="coupon-toolbar-right">

          {/* FILTER */}

          <div className="filter-wrapper">

            <button
              className="filter-btn"
              onClick={() =>
                setShowFilter(
                  !showFilter
                )
              }
            >

              <span className="filter-icon">
                ▼
              </span>

              Filter By

            </button>

            {showFilter && (
              <div className="filter-dropdown">

                <button
                  onClick={() => {
                    setActiveFilter(
                      "All"
                    );

                    setShowFilter(
                      false
                    );
                  }}
                >
                  All Coupons
                </button>

                <button
                  onClick={() => {
                    setActiveFilter(
                      "Active"
                    );

                    setShowFilter(
                      false
                    );
                  }}
                >
                  Active
                </button>

                <button
                  onClick={() => {
                    setActiveFilter(
                      "Expired"
                    );

                    setShowFilter(
                      false
                    );
                  }}
                >
                  Expired
                </button>

                <button
                  onClick={() => {
                    setActiveFilter(
                      "Scheduled"
                    );

                    setShowFilter(
                      false
                    );
                  }}
                >
                  Scheduled
                </button>

              </div>
            )}

          </div>

          {/* ADD */}

         

          {/* EXPORT */}

          <button
            className="export-btn"
            onClick={() => {
              console.log(
                "Export will be implemented later"
              );
            }}
          >
            Export
          </button>

        </div>

      </div>

      {/* =====================================
          TABLE
      ===================================== */}

      <div className="coupon-table-container">

        <table className="coupon-table">

          <thead>

            <tr>

              <th>Code</th>

              <th>Discount</th>

              <th>Valid From</th>

              <th>Valid To</th>

              <th>Status</th>

              <th>Action</th>

            </tr>

          </thead>

          <tbody>

            {filteredCoupons.length > 0 ? (

              filteredCoupons.map(
                (coupon) => {

                  const status =
                    getCouponStatus(
                      coupon
                    );

                  return (

                    <tr
                      key={coupon._id}
                    >

                      {/* CODE */}

                      <td className="coupon-code">
                        {coupon.code}
                      </td>

                      {/* DISCOUNT */}

                      <td>
                        {displayDiscount(
                          coupon
                        )}
                      </td>

                      {/* VALID FROM */}

                      <td>
                        {formatDate(
                          coupon.valid_from
                        )}
                      </td>

                      {/* VALID TO */}

                      <td>
                        {formatDate(
                          coupon.valid_to
                        )}
                      </td>

                      {/* STATUS */}

                      <td>

                        <span
                          className={`coupon-status ${status.toLowerCase()}`}
                        >

                          <span className="status-symbol">

                            {status ===
                              "Active" &&
                              "✓"}

                            {status ===
                              "Expired" &&
                              "×"}

                            {status ===
                              "Scheduled" &&
                              "◉"}

                            {status ===
                              "Inactive" &&
                              "−"}

                          </span>

                          {status}

                        </span>

                      </td>

                      {/* ACTION */}

                      <td>

                        <div className="coupon-actions">

                          <button
                            className="edit-btn"
                            onClick={() =>
                              handleEdit(
                                coupon
                              )
                            }
                          >
                            ✎ Edit
                          </button>

                          <button
                            className="delete-btn"
                            onClick={() =>
                              handleDelete(
                                coupon._id
                              )
                            }
                          >
                            ▣ Delete
                          </button>

                        </div>

                      </td>

                    </tr>

                  );
                }
              )

            ) : (

              <tr>

                <td
                  colSpan="6"
                  className="no-coupon"
                >
                  No coupons found
                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>

      {/* =====================================
          PAGINATION
      ===================================== */}

      <div className="coupon-pagination">

        <button
          className="pagination-btn"
          onClick={() => {
            console.log(
              "Previous page"
            );
          }}
        >
          Previous
        </button>

        <button className="pagination-number active-page">
          1
        </button>

        <button className="pagination-number">
          2
        </button>

        <button
          className="pagination-btn"
          onClick={() => {
            console.log(
              "Next page"
            );
          }}
        >
          Next
        </button>

      </div>

      {/* =====================================
          DELETE CONFIRMATION POPUP
      ===================================== */}

      {deletePopup.show && (

        <div className="coupon-modal-overlay">

          <div className="coupon-modal">

            <div className="modal-icon cancel">
              ?
            </div>

            <h3>
              Delete Coupon?
            </h3>

            <p>
              Are you sure you want to
              delete this coupon?
              This action cannot be
              undone.
            </p>

            <div className="modal-actions">

              <button
                className="modal-secondary-btn"
                onClick={
                  closeDeletePopup
                }
              >
                Cancel
              </button>

              <button
                className="modal-danger-btn"
                onClick={
                  confirmDelete
                }
              >
                Yes, Delete
              </button>

            </div>

          </div>

        </div>

      )}

      {/* =====================================
          SUCCESS / ERROR POPUP
      ===================================== */}

      {popup.show && (

        <div className="coupon-modal-overlay">

          <div className="coupon-modal">

            <div
              className={`modal-icon ${popup.type}`}
            >

              {popup.type ===
                "success" && "✓"}

              {popup.type ===
                "error" && "!"}

            </div>

            <h3>
              {popup.title}
            </h3>

            <p>
              {popup.message}
            </p>

            <div className="modal-actions">

              <button
                className="modal-primary-btn"
                onClick={closePopup}
              >
                OK
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};

export default Coupon;