import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import "./Profile.css";


const VERIFY_EMAIL_OTP_URL = "/profile/profile/email-change/verify";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    FullName: "",
    email: "",
    MobileNumber: "",
  });

  // OTP modal state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const fullNameRef = useRef(null);
  const otpRefs = useRef([]);

  // ==========================================
  // LOAD USER FROM LOCAL STORAGE
  // ==========================================
  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setFormData({
          FullName: parsedUser.FullName || "",
          email: parsedUser.email || "",
          MobileNumber: parsedUser.MobileNumber || "",
        });
      } catch (error) {
        console.error("Error reading user:", error);
      }
    }
  }, []);

  // ==========================================
  // RESEND COUNTDOWN
  // ==========================================
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // ==========================================
  // INPUT CHANGE
  // ==========================================
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "FullName") {
      const sanitized = value.replace(/[^a-zA-Z\s]/g, "");
      setFormData((prev) => ({ ...prev, FullName: sanitized }));
      return;
    }

    if (name === "MobileNumber") {
      const sanitized = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, MobileNumber: sanitized }));
      return;
    }

    if (name === "email") {
      setFormData((prev) => ({ ...prev, email: value }));
    }
  };

  // ==========================================
  // EDIT / CANCEL
  // ==========================================
  const handleEdit = () => {
    setIsEditing(true);
    setTimeout(() => fullNameRef.current?.focus(), 0);
  };

  const handleCancel = () => {
    setFormData({
      FullName: user?.FullName || "",
      email: user?.email || "",
      MobileNumber: user?.MobileNumber || "",
    });
    setErrorMessage("");
    setIsEditing(false);
  };

  // ==========================================
  // SAVE PROFILE (name + phone) AFTER EMAIL OK
  // ==========================================
  const saveProfile = async (extra = {}) => {
    const response = await API.put("/profile/profile/update", {
      FullName: formData.FullName,
      MobileNumber: formData.MobileNumber,
      ...extra,
    });

    const data = response.data.user || response.data;

    // make sure the verified email is kept even if backend doesn't return it
    const updatedUser = {
      ...user,
      ...data,
      email: data.email || extra.email || user?.email,
    };

    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setFormData({
      FullName: updatedUser.FullName || "",
      email: updatedUser.email || "",
      MobileNumber: updatedUser.MobileNumber || "",
    });
    setIsEditing(false);
  };

  // ==========================================
  // UPDATE BUTTON
  // ==========================================
  const handleUpdate = async () => {
    setErrorMessage("");

    if (!formData.FullName.trim()) {
      setErrorMessage("Full name is required.");
      return;
    }

    if (!formData.email.trim()) {
      setErrorMessage("Email is required.");
      return;
    }

    if (formData.MobileNumber && formData.MobileNumber.length !== 10) {
      setErrorMessage("Mobile number must contain 10 digits.");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const emailChanged =
        formData.email.trim().toLowerCase() !==
        user?.email?.trim().toLowerCase();

      // ---------- CASE 1: EMAIL CHANGED -> send OTP, open popup ----------
      if (emailChanged) {
        await API.post("/profile/profile/email-change", {
          newEmail: formData.email.trim(),
        });

        setOtp(Array(OTP_LENGTH).fill(""));
        setOtpError("");
        setResendTimer(RESEND_SECONDS);
        setShowOtpModal(true);
        setTimeout(() => otpRefs.current[0]?.focus(), 50);
        return;
      }

      // ---------- CASE 2: EMAIL NOT CHANGED ----------
      await saveProfile();
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("PROFILE UPDATE ERROR:", error);
      setErrorMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update profile."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // OTP BOX HANDLERS
  // ==========================================
  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);

    setOtp((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    setOtpError("");

    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      handleVerifyOtp();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!pasted) return;

    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((d, i) => (next[i] = d));
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  // ==========================================
  // VERIFY OTP -> then save profile
  // ==========================================
  const handleVerifyOtp = async () => {
    const code = otp.join("");

    if (code.length !== OTP_LENGTH) {
      setOtpError(`Enter the ${OTP_LENGTH}-digit OTP.`);
      return;
    }

    setOtpLoading(true);
    setOtpError("");

    try {
      await API.post(VERIFY_EMAIL_OTP_URL, {
        newEmail: formData.email.trim(),
        otp: code,
      });

      await saveProfile({ email: formData.email.trim() });

      setShowOtpModal(false);
      alert("Email verified and profile updated successfully!");
    } catch (error) {
      console.error("OTP VERIFY ERROR:", error);
      setOtpError(
        error?.response?.data?.message || "Invalid or expired OTP."
      );
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    try {
      setOtpError("");
      await API.post("/profile/profile/email-change", {
        newEmail: formData.email.trim(),
      });
      setOtp(Array(OTP_LENGTH).fill(""));
      setResendTimer(RESEND_SECONDS);
      otpRefs.current[0]?.focus();
    } catch (error) {
      setOtpError(
        error?.response?.data?.message || "Failed to resend OTP."
      );
    }
  };

  const handleCloseOtp = () => {
    if (otpLoading) return;
    setShowOtpModal(false);
    setOtp(Array(OTP_LENGTH).fill(""));
    setOtpError("");
  };

  // ==========================================
  // NO USER
  // ==========================================
  if (!user) {
    return (
      <div className="profile-page">
        <h2 className="profile-title">Profile</h2>
        <p>User details not available.</p>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================
  return (
    <div className="profile-page">
      <h2 className="profile-title">
        Welcome <span>{formData.FullName || "User"}</span>!
      </h2>

      <div className="profile-card">
        {/* FULL NAME */}
        <div className="profile-field">
          <label htmlFor="FullName">Full Name</label>
          <input
            id="FullName"
            ref={fullNameRef}
            type="text"
            name="FullName"
            value={formData.FullName}
            onChange={handleChange}
            readOnly={!isEditing}
            className={isEditing ? "editable-input" : ""}
          />
        </div>

        {/* EMAIL */}
        <div className="profile-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            readOnly={!isEditing}
            className={isEditing ? "editable-input" : ""}
          />
        </div>

        {/* MOBILE */}
        <div className="profile-field">
          <label htmlFor="MobileNumber">Phone</label>
          <input
            id="MobileNumber"
            type="text"
            name="MobileNumber"
            value={formData.MobileNumber}
            onChange={handleChange}
            readOnly={!isEditing}
            placeholder={isEditing ? "Enter 10-digit number" : ""}
            className={isEditing ? "editable-input" : ""}
          />
        </div>

        {errorMessage && (
          <p className="profile-error" role="alert">
            {errorMessage}
          </p>
        )}

        {!isEditing ? (
          <button
            type="button"
            className="edit-profile-btn"
            onClick={handleEdit}
          >
            EDIT
          </button>
        ) : (
          <div className="profile-button-group">
            <button
              type="button"
              className="edit-profile-btn"
              onClick={handleUpdate}
              disabled={loading}
            >
              {loading ? "UPDATING..." : "UPDATE"}
            </button>

            <button
              type="button"
              className="cancel-profile-btn"
              onClick={handleCancel}
              disabled={loading}
            >
              CANCEL
            </button>
          </div>
        )}
      </div>

      {/* ==========================================
          OTP POPUP (black theme)
      ========================================== */}
      {showOtpModal && (
        <div className="otp-overlay" onClick={handleCloseOtp}>
          <div
            className="otp-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="otp-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="otp-close"
              onClick={handleCloseOtp}
              aria-label="Close"
            >
              ×
            </button>

            <h3 id="otp-title" className="otp-title">
              Verify Email
            </h3>

            <p className="otp-subtitle">
              We sent a {OTP_LENGTH}-digit code to
              <br />
              <strong>{formData.email}</strong>
            </p>

            <div className="otp-inputs" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (otpRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="otp-box"
                />
              ))}
            </div>

            {otpError && (
              <p className="otp-error" role="alert">
                {otpError}
              </p>
            )}

            <button
              type="button"
              className="otp-verify-btn"
              onClick={handleVerifyOtp}
              disabled={otpLoading}
            >
              {otpLoading ? "VERIFYING..." : "VERIFY"}
            </button>

            <button
              type="button"
              className="otp-resend-btn"
              onClick={handleResendOtp}
              disabled={resendTimer > 0 || otpLoading}
            >
              {resendTimer > 0
                ? `Resend OTP in ${resendTimer}s`
                : "Resend OTP"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;