import React, { useEffect, useRef, useState } from "react";
import {
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import API from "../../api/axios";
import "./changepassword.css";

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // OTP
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);

  // OTP input refs
  const otpRefs = useRef([]);

  // Resend
  const [resendTimer, setResendTimer] = useState(0);
  const [resending, setResending] = useState(false);

  // Password visibility
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Loading
  const [loading, setLoading] = useState(false);

  // Popup
  const [popup, setPopup] = useState({
    show: false,
    type: "",
    title: "",
    message: "",
  });

  // ==========================================
  // RESEND TIMER
  // ==========================================

  useEffect(() => {
    if (resendTimer <= 0) return;

    const timer = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [resendTimer]);

  // ==========================================
  // REQUEST PASSWORD CHANGE
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPopup({
        show: true,
        type: "error",
        title: "Missing Details",
        message: "Please fill in all the password fields.",
      });
      return;
    }

    if (newPassword.length < 6) {
      setPopup({
        show: true,
        type: "error",
        title: "Invalid Password",
        message: "New password must contain at least 6 characters.",
      });
      return;
    }

    if (/\s/.test(newPassword)) {
      setPopup({
        show: true,
        type: "error",
        title: "Invalid Password",
        message: "Password must not contain spaces.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPopup({
        show: true,
        type: "error",
        title: "Password Mismatch",
        message: "New password and confirm password do not match.",
      });
      return;
    }

    try {
      setLoading(true);

      const response = await API.post("/auth/change-password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      console.log("CHANGE PASSWORD RESPONSE:", response.data);

      setShowOtp(true);
      setOtp("");

      // 60 SECOND RESEND TIMER
      setResendTimer(60);

      setPopup({
        show: true,
        type: "success",
        title: "OTP Sent",
        message:
          "A verification code has been sent to your registered email.",
      });

      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 200);
    } catch (error) {
      console.error("CHANGE PASSWORD ERROR:", error);

      setPopup({
        show: true,
        type: "error",
        title: "Change Password Failed",
        message:
          error.response?.data?.message ||
          "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // OTP INPUT
  // ==========================================

  const handleOtpChange = (index, value) => {
    const number = value.replace(/\D/g, "").slice(-1);

    const otpArray = otp.padEnd(6, "").split("");

    if (number) {
      otpArray[index] = number;
    } else {
      otpArray[index] = "";
    }

    const newOtp = otpArray.join("").replace(/\s/g, "");

    setOtp(newOtp);

    if (number && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // ==========================================
  // OTP KEYBOARD
  // ==========================================

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      const otpArray = otp.padEnd(6, "").split("");

      if (otpArray[index]) {
        otpArray[index] = "";
        setOtp(otpArray.join(""));
      } else if (index > 0) {
        otpRefs.current[index - 1]?.focus();

        otpArray[index - 1] = "";
        setOtp(otpArray.join(""));
      }
    }

    if (e.key === "ArrowLeft" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }

    if (e.key === "ArrowRight" && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // ==========================================
  // VERIFY OTP
  // ==========================================

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      setPopup({
        show: true,
        type: "error",
        title: "Invalid OTP",
        message: "Please enter the 6-digit verification code.",
      });
      return;
    }

    try {
      setLoading(true);

      const response = await API.post(
        "/auth/verify-change-password",
        {
          otp,
        }
      );

      console.log(
        "VERIFY CHANGE PASSWORD RESPONSE:",
        response.data
      );

      setPopup({
        show: true,
        type: "success",
        title: "Password Updated!",
        message:
          "Your password has been changed successfully.",
      });

      // Clear fields only after successful verification
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setOtp("");

      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
      setShowOtp(false);
      setResendTimer(0);
    } catch (error) {
      console.error(
        "VERIFY CHANGE PASSWORD ERROR:",
        error
      );

      setPopup({
        show: true,
        type: "error",
        title: "OTP Verification Failed",
        message:
          error.response?.data?.message ||
          "Invalid or expired OTP.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // RESEND OTP
  // ==========================================

  const handleResendOtp = async () => {
    if (resendTimer > 0 || resending) return;

    try {
      setResending(true);

      await API.post("/auth/change-password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setOtp("");

      // Restart timer at 60 seconds
      setResendTimer(60);

      setPopup({
        show: true,
        type: "success",
        title: "Code Resent",
        message:
          "A new verification code has been sent to your email.",
      });

      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 200);
    } catch (error) {
      console.error("RESEND OTP ERROR:", error);

      setPopup({
        show: true,
        type: "error",
        title: "Resend Failed",
        message:
          error.response?.data?.message ||
          "Unable to resend the verification code.",
      });
    } finally {
      setResending(false);
    }
  };

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

  return (
    <>
      {/* =========================================
          CHANGE PASSWORD
      ========================================= */}

      <div className="change-password-container">
        <div className="change-password-box">

          {/* HEADER */}

          {!showOtp && (
            <>
              <h1>Change Password</h1>

              <p className="change-password-email">
                example@gmail.com
              </p>
            </>
          )}

          {/* =====================================
              PASSWORD FORM
          ===================================== */}

          {!showOtp && (
            <form
              className="change-password-form"
              onSubmit={handleSubmit}
            >

              {/* CURRENT PASSWORD */}

              <div className="password-group">
                <label htmlFor="currentPassword">
                  Current Password
                </label>

                <div className="password-input-wrapper">
                  <input
                    id="currentPassword"
                    type={
                      showCurrent
                        ? "text"
                        : "password"
                    }
                    value={currentPassword}
                    onChange={(e) =>
                      setCurrentPassword(
                        e.target.value
                      )
                    }
                    placeholder="Enter current password"
                    disabled={loading}
                  />

                  <button
                    type="button"
                    className="password-eye"
                    onClick={() =>
                      setShowCurrent(
                        (prev) => !prev
                      )
                    }
                  >
                    {showCurrent ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* NEW PASSWORD */}

              <div className="password-group">
                <label htmlFor="newPassword">
                  New Password
                </label>

                <div className="password-input-wrapper">
                  <input
                    id="newPassword"
                    type={
                      showNew
                        ? "text"
                        : "password"
                    }
                    value={newPassword}
                    onChange={(e) =>
                      setNewPassword(
                        e.target.value
                      )
                    }
                    placeholder="Enter new password"
                    disabled={loading}
                  />

                  <button
                    type="button"
                    className="password-eye"
                    onClick={() =>
                      setShowNew(
                        (prev) => !prev
                      )
                    }
                  >
                    {showNew ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* CONFIRM PASSWORD */}

              <div className="password-group">
                <label htmlFor="confirmPassword">
                  Confirm New Password
                </label>

                <div className="password-input-wrapper">
                  <input
                    id="confirmPassword"
                    type={
                      showConfirm
                        ? "text"
                        : "password"
                    }
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    placeholder="Confirm new password"
                    disabled={loading}
                  />

                  <button
                    type="button"
                    className="password-eye"
                    onClick={() =>
                      setShowConfirm(
                        (prev) => !prev
                      )
                    }
                  >
                    {showConfirm ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* UPDATE */}

              <button
                type="submit"
                className="update-password-button"
                disabled={loading}
              >
                {loading
                  ? "Sending OTP..."
                  : "Update Password"}
              </button>

            </form>
          )}

          {/* =====================================
              OTP FORM
          ===================================== */}

          {showOtp && (
            <form
              className="otp-form"
              onSubmit={handleVerifyOtp}
            >

              <div className="otp-header">

                <div className="otp-icon">
                  <span>✉</span>
                </div>

                <h1>Verify Your Email</h1>

                <p>
                  Enter the 6-digit code sent to
                  your registered email address.
                </p>

              </div>

              {/* OTP BOXES */}

              <div className="otp-inputs">
                {[0, 1, 2, 3, 4, 5].map(
                  (index) => (
                    <input
                      key={index}
                      ref={(el) =>
                        (otpRefs.current[index] = el)
                      }
                      className="otp-box"
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={otp[index] || ""}
                      onChange={(e) =>
                        handleOtpChange(
                          index,
                          e.target.value
                        )
                      }
                      onKeyDown={(e) =>
                        handleOtpKeyDown(
                          index,
                          e
                        )
                      }
                      disabled={loading}
                    />
                  )
                )}
              </div>

              {/* RESEND */}

              <div className="resend-section">

                <span>
                  Didn't receive the code?
                </span>

                {resendTimer > 0 ? (
                  <span className="resend-timer">
                    Resend in {resendTimer}s
                  </span>
                ) : (
                  <button
                    type="button"
                    className="resend-button"
                    onClick={handleResendOtp}
                    disabled={resending}
                  >
                    {resending
                      ? "Sending..."
                      : "Resend code"}
                  </button>
                )}

              </div>

              {/* VERIFY */}

              <button
                type="submit"
                className="update-password-button otp-verify-button"
                disabled={loading}
              >
                {loading
                  ? "Verifying..."
                  : "Verify & Continue"}
              </button>

            </form>
          )}

        </div>
      </div>

      {/* =========================================
          SUCCESS / ERROR POPUP
          NO CROSS BUTTON
      ========================================= */}

      {popup.show && (
        <div
          className="password-popup-overlay"
          onClick={closePopup}
        >
          <div
            className={`password-popup ${
              popup.type === "success"
                ? "success-popup"
                : "error-popup"
            }`}
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* ICON */}

            <div className="popup-icon">
              {popup.type === "success" ? (
                <CheckCircle size={34} />
              ) : (
                <AlertCircle size={34} />
              )}
            </div>

            {/* TITLE */}

            <h2>
              {popup.title}
            </h2>

            {/* MESSAGE */}

            <p>
              {popup.message}
            </p>

            {/* OKAY */}

            <button
              type="button"
              className="popup-ok-button"
              onClick={closePopup}
            >
              Okay
            </button>

          </div>
        </div>
      )}
    </>
  );
};

export default ChangePassword;