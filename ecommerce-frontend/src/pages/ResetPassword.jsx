import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import { resetPasswordAPI } from "../service/Authservice";
import "./ResetPassword.css";

function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  // ==========================================
  // GET EMAIL AND OTP
  // ==========================================

  const email = location.state?.email || "";
  const otp = location.state?.otp || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ==========================================
  // POPUP
  // ==========================================

  const [popup, setPopup] = useState({
    show: false,
    type: "",
    title: "",
    message: "",
  });

  // ==========================================
  // CLOSE POPUP
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
  // RESET PASSWORD
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // ==========================================
    // CHECK EMAIL
    // ==========================================

    if (!email) {
      setError(
        "Email not found. Please start the forgot password process again."
      );
      return;
    }

    // ==========================================
    // CHECK OTP
    // ==========================================

    if (!otp) {
      setError(
        "OTP not found. Please verify the OTP again."
      );
      return;
    }

    // ==========================================
    // CHECK PASSWORD
    // ==========================================

    if (!password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    // ==========================================
    // PASSWORD LENGTH
    // ==========================================

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    // ==========================================
    // PASSWORD SPACE
    // ==========================================

    if (/\s/.test(password)) {
      setError(
        "Password must not contain spaces."
      );
      return;
    }

    // ==========================================
    // CONFIRM PASSWORD
    // ==========================================

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      // ==========================================
      // RESET PASSWORD API
      // ==========================================

      const response = await resetPasswordAPI({
        email: email,
        otp: otp,
        newPassword: password,
      });

      console.log(
        "RESET PASSWORD RESPONSE:",
        response
      );

      // ==========================================
      // SUCCESS POPUP
      // ==========================================

      setPopup({
        show: true,
        type: "success",
        title: "Password Reset Successfully",
        message:
          "Your password has been updated successfully. You can now login with your new password.",
      });

    } catch (err) {
      console.error(
        "RESET PASSWORD ERROR:",
        err
      );

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to reset password.";

      setPopup({
        show: true,
        type: "error",
        title: "Reset Password Failed",
        message: message,
      });

    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <>
      <div className="reset-password-page">

        <div className="reset-password-card">

          {/* HEADER */}

          <h1>
            Reset Password
          </h1>

          <p className="reset-password-subtitle">
            Create a new password for:
            <br />

            <strong>
              {email}
            </strong>
          </p>

          {/* FORM */}

          <form onSubmit={handleSubmit}>

            {/* ==================================
                NEW PASSWORD
            ================================== */}

            <div className="reset-field">

              <label>
                New Password
              </label>

              <div className="reset-input-wrapper">

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter new password"
                  disabled={loading}
                />

                <button
                  type="button"
                  className="reset-eye-button"
                  onClick={() =>
                    setShowPassword(
                      (prev) => !prev
                    )
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

              </div>

            </div>

            {/* ==================================
                CONFIRM PASSWORD
            ================================== */}

            <div className="reset-field">

              <label>
                Confirm Password
              </label>

              <div className="reset-input-wrapper">

                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(
                      e.target.value
                    );
                    setError("");
                  }}
                  placeholder="Confirm new password"
                  disabled={loading}
                />

                <button
                  type="button"
                  className="reset-eye-button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (prev) => !prev
                    )
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

              </div>

            </div>

            {/* ==================================
                ERROR
            ================================== */}

            {error && (
              <p
                className="reset-error"
                role="alert"
              >
                {error}
              </p>
            )}

            {/* ==================================
                RESET BUTTON
            ================================== */}

            <button
              type="submit"
              className="reset-submit-button"
              disabled={loading}
            >
              {loading
                ? "RESETTING..."
                : "RESET PASSWORD"}
            </button>

          </form>

        </div>

      </div>

      {/* ==========================================
          SUCCESS / ERROR POPUP
          NO CROSS BUTTON
      ========================================== */}

      {popup.show && (
        <div
          className="reset-popup-overlay"
          onClick={closePopup}
        >

          <div
            className={`reset-popup ${
              popup.type === "success"
                ? "success-reset-popup"
                : "error-reset-popup"
            }`}
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="reset-popup-icon">

              {popup.type === "success" ? (
                <CheckCircle size={34} />
              ) : (
                <AlertCircle size={34} />
              )}

            </div>

            <h2>
              {popup.title}
            </h2>

            <p>
              {popup.message}
            </p>

            <button
              type="button"
              className="reset-popup-button"
              onClick={() => {
                closePopup();

                if (
                  popup.type === "success"
                ) {
                  navigate("/login", {
                    replace: true,
                  });
                }
              }}
            >
              Okay
            </button>

          </div>

        </div>
      )}
    </>
  );
}

export default ResetPassword;