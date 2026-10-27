
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../Api/axios";
import "./CouponForm.css";

const AddCoupon = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    code: "",
    discounttype: "percentage",
    discountvalue: "",
    valid_from: "",
    valid_to: "",
    minorderAmount: "",
    maxdiscountAmount: "",
    status: "active",
    usespercustomer: "",
    totalusagelimit: "",
  });

  const [error, setError] = useState("");

  const [popup, setPopup] = useState({
    show: false,
    type: "",
    title: "",
    message: "",
  });

  // ==========================================
  // INPUT CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  // ==========================================
  // SAVE COUPON
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // Minimum purchase amount validation
    const minOrderValue = formData.minorderAmount;

    if (minOrderValue === "") {
      setError("Please enter the minimum purchase amount.");
      return;
    }

    const minOrderAmount = Number(minOrderValue);

    if (
      !Number.isFinite(minOrderAmount) ||
      minOrderAmount < 0
    ) {
      setError(
        "Minimum purchase amount must be a valid non-negative amount."
      );
      return;
    }

    try {
      const response = await api.post(
        "/admin/coupons",
        formData
      );

      if (response.data.success) {
        setPopup({
          show: true,
          type: "success",
          title: "Success",
          message: "Coupon created successfully.",
        });
      }
    } catch (error) {
      console.error("CREATE COUPON ERROR:", error);

      setPopup({
        show: true,
        type: "error",
        title: "Error",
        message:
          error.response?.data?.message ||
          "Failed to create coupon.",
      });
    }
  };

  // ==========================================
  // CANCEL POPUP
  // ==========================================

  const handleCancel = () => {
    setPopup({
      show: true,
      type: "cancel",
      title: "Cancel Coupon",
      message:
        "Are you sure you want to cancel? Your entered data will be lost.",
    });
  };

  // ==========================================
  // POPUP ACTION
  // ==========================================

  const handlePopupAction = () => {
    if (popup.type === "success") {
      navigate("/admin/coupon");
      return;
    }

    if (popup.type === "cancel") {
      navigate("/admin/coupon");
      return;
    }

    if (popup.type === "error") {
      setPopup({
        show: false,
        type: "",
        title: "",
        message: "",
      });
    }
  };

  const closePopup = () => {
    setPopup({
      show: false,
      type: "",
      title: "",
      message: "",
    });
  };

  return (
    <div className="coupon-form-page">
      <div className="coupon-form-card">
        <h2>ADD COUPON</h2>

        <form onSubmit={handleSubmit}>
          {/* CODE */}

          <div className="form-group">
            <label>
              Code <span>*</span>
            </label>

            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="Enter coupon code(eg:save78)"
              required
            />

            <small>
              Coupon code must be unique.
            </small>
          </div>

          {/* DISCOUNT TYPE */}

          <div className="form-group">
            <label>
              Discount Type <span>*</span>
            </label>

            <select
              name="discounttype"
              value={formData.discounttype}
              onChange={handleChange}
              required
            >
              <option value="percentage">
                Percentage(%)
              </option>

              <option value="fixed">
                Fixed Amount(₹)
              </option>
            </select>
          </div>

          {/* DISCOUNT VALUE */}

          <div className="form-group">
            <label>
              Discount value <span>*</span>
            </label>

            <input
              type="number"
              name="discountvalue"
              value={formData.discountvalue}
              onChange={handleChange}
              placeholder="Enter discount value"
              min="1"
              required
            />
          </div>

          {/* DATES */}

          <div className="form-row">
            <div className="form-group">
              <label>
                Valid From <span>*</span>
              </label>

              <input
                type="date"
                name="valid_from"
                value={formData.valid_from}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>
                Valid To <span>*</span>
              </label>

              <input
                type="date"
                name="valid_to"
                value={formData.valid_to}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* AMOUNTS */}

          <div className="form-row">
            <div className="form-group">
              <label>
                Minimum Order Amount
              </label>

              <div className="amount-input">
                <span>₹</span>

                <input
                  type="number"
                  name="minorderAmount"
                  value={formData.minorderAmount}
                  onChange={handleChange}
                  placeholder="Enter the amount"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>
                Max Discount Amount
              </label>

              <div className="amount-input">
                <span>₹</span>

                <input
                  type="number"
                  name="maxdiscountAmount"
                  value={formData.maxdiscountAmount}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  min="0"
                  disabled={
                    formData.discounttype === "fixed"
                  }
                />
              </div>
            </div>
          </div>

          {/* STATUS */}

          <div className="form-group status-group">
            <label>Status</label>

            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>
            </select>
          </div>

          {/* USAGE */}

          <div className="form-row">
            <div className="form-group">
              <label>
                Uses per customer
              </label>

              <input
                type="number"
                name="usespercustomer"
                value={formData.usespercustomer}
                onChange={handleChange}
                placeholder="number"
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label>
                Total Usage Limit
              </label>

              <input
                type="number"
                name="totalusagelimit"
                value={formData.totalusagelimit}
                onChange={handleChange}
                placeholder="number"
                min="1"
                required
              />
            </div>
          </div>

          {/* ERROR */}

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          {/* BUTTONS */}

          <div className="coupon-form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={handleCancel}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="save-btn"
            >
              Save
            </button>
          </div>
        </form>
      </div>

      {/* POPUP */}

      {popup.show && (
        <div className="coupon-modal-overlay">
          <div className="coupon-modal">
            <div
              className={`modal-icon ${popup.type}`}
            >
              {popup.type === "success" && "✓"}
              {popup.type === "error" && "!"}
              {popup.type === "cancel" && "?"}
            </div>

            <h3>
              {popup.title}
            </h3>

            <p>
              {popup.message}
            </p>

            <div className="modal-actions">
              {popup.type === "cancel" ? (
                <>
                  <button
                    className="modal-secondary-btn"
                    onClick={closePopup}
                  >
                    Stay
                  </button>

                  <button
                    className="modal-danger-btn"
                    onClick={handlePopupAction}
                  >
                    Yes, Cancel
                  </button>
                </>
              ) : (
                <button
                  className="modal-primary-btn"
                  onClick={handlePopupAction}
                >
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddCoupon;
