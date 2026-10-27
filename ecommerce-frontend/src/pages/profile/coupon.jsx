import React, { useEffect, useState } from "react";
import API from "../../api/axios";
import "./coupon.css";

const Coupon = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const couponsPerPage = 4;

  // ==========================================
  // FETCH COUPONS
  // ==========================================

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        setLoading(true);
        setError("");

        // IMPORTANT: await is required
        const response = await API.get("/admin/coupons");

        console.log("COUPON RESPONSE:", response.data);

        const couponData =
          response.data?.data ||
          response.data?.coupons ||
          [];

        console.log("COUPON ARRAY:", couponData);

        setCoupons(
          Array.isArray(couponData)
            ? couponData
            : []
        );

      } catch (error) {
        console.error(
          "COUPON FETCH ERROR:",
          error
        );

        setError(
          error?.response?.data?.message ||
            "Failed to load coupons"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, []);

  // ==========================================
  // PAGINATION
  // ==========================================

  const totalPages = Math.ceil(
    coupons.length / couponsPerPage
  );

  const startIndex =
    (currentPage - 1) * couponsPerPage;

  const paginatedCoupons = coupons.slice(
    startIndex,
    startIndex + couponsPerPage
  );

  // ==========================================
  // DATE FORMAT
  // ==========================================

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ==========================================
  // DISCOUNT TEXT
  // ==========================================

  const getDiscountText = (coupon) => {
    const value = Number(
      coupon.discountvalue || 0
    );

    if (
      String(coupon.discounttype).toLowerCase() ===
      "percentage"
    ) {
      return `EXTRA ${value}% OFF`;
    }

    return `EXTRA ₹${value} OFF`;
  };

  // ==========================================
  // PURCHASE CONDITION
  // ==========================================

  const getPurchaseText = (coupon) => {
    const minimum = Number(
      coupon.minorderAmount || 0
    );

    if (minimum > 0) {
      return `BUY for above ₹${minimum.toLocaleString(
        "en-IN"
      )}`;
    }

    return "Available on your purchase";
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="coupon-page">
        <div className="coupon-box">

          <h2 className="coupon-heading">
            Available Coupons
          </h2>

          <div className="coupon-loading">
            Loading coupons...
          </div>

        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="coupon-page">
        <div className="coupon-box">

          <h2 className="coupon-heading">
            Available Coupons
          </h2>

          <div className="coupon-error">
            {error}
          </div>

        </div>
      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="coupon-page">

      <div className="coupon-box">

        {/* ==================================
            TITLE
        ================================== */}

        <h2 className="coupon-heading">
          Available Coupons
        </h2>

        {/* ==================================
            NO COUPONS
        ================================== */}

        {coupons.length === 0 ? (
          <div className="no-coupons">
            No coupons available
          </div>
        ) : (
          <>

            {/* ==================================
                COUPON LIST
            ================================== */}

            <div className="coupon-list">

              {paginatedCoupons.map(
                (coupon) => (

                  <div
                    className="coupon-item"
                    key={coupon._id}
                  >

                    {/* ==========================
                        LEFT SIDE
                    ========================== */}

                    <div className="coupon-left">

                      <div className="coupon-title">
                        {getDiscountText(coupon)}
                      </div>

                      <div className="coupon-description">

                        {getPurchaseText(coupon)}

                        {/* FIRST ORDER */}
                        {coupon.couponType ===
                          "firstOrder" && (
                          <span className="first-order">
                            {" "}• First order only
                          </span>
                        )}

                      </div>

                    </div>

                    {/* ==========================
                        RIGHT SIDE
                    ========================== */}

                    <div className="coupon-right">

                      <div className="coupon-valid">
                        Valid till{" "}
                        {formatDate(
                          coupon.valid_to
                        )}
                      </div>

                      <div className="coupon-code">
                        {coupon.code}
                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

            {/* ==================================
                PAGINATION
            ================================== */}

            {totalPages > 1 && (
              <div className="coupon-pagination">

                {/* PREVIOUS */}

                <button
                  className="coupon-arrow"
                  disabled={
                    currentPage === 1
                  }
                  onClick={() =>
                    setCurrentPage(
                      (prev) =>
                        Math.max(
                          prev - 1,
                          1
                        )
                    )
                  }
                >
                  ‹
                </button>

                {/* PAGE NUMBERS */}

                {Array.from(
                  {
                    length: totalPages,
                  },
                  (_, index) => index + 1
                ).map((page) => (

                  <button
                    key={page}
                    className={
                      currentPage === page
                        ? "coupon-page-number active"
                        : "coupon-page-number"
                    }
                    onClick={() =>
                      setCurrentPage(page)
                    }
                  >
                    {page}
                  </button>

                ))}

                {/* NEXT */}

                <button
                  className="coupon-arrow"
                  disabled={
                    currentPage === totalPages
                  }
                  onClick={() =>
                    setCurrentPage(
                      (prev) =>
                        Math.min(
                          prev + 1,
                          totalPages
                        )
                    )
                  }
                >
                  ›
                </button>

              </div>
            )}

          </>
        )}

      </div>

    </div>
  );
};

export default Coupon;