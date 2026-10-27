import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerAPI } from "../service/Authservice";

export const useSignup = () => {
  const navigate = useNavigate();

  // ==============================
  // FORM DATA
  // ==============================

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobileNumber: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
  });

  // ==============================
  // STATES
  // ==============================

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ==============================
  // HANDLE INPUT CHANGE
  // ==============================

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Full name
    // Only letters and spaces
    if (name === "fullName") {
      const sanitizedName = value.replace(/[^a-zA-Z ]/g, "");

      setFormData((prev) => ({
        ...prev,
        fullName: sanitizedName,
      }));

      return;
    }

    // Mobile number
    // Numbers only
    // Maximum 10 digits
    if (name === "mobileNumber") {
      const sanitizedMobile = value
        .replace(/\D/g, "")
        .slice(0, 10);

      setFormData((prev) => ({
        ...prev,
        mobileNumber: sanitizedMobile,
      }));

      return;
    }

    // Referral code
    // Letters and numbers only
    // Convert to uppercase
    if (name === "referralCode") {
      const sanitizedReferral = value
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase();

      setFormData((prev) => ({
        ...prev,
        referralCode: sanitizedReferral,
      }));

      return;
    }

    // Other fields
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==============================
  // SUBMIT SIGNUP
  // ==============================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // ==============================
    // REQUIRED FIELD VALIDATION
    // ==============================

    if (
      !formData.fullName ||
      !formData.email ||
      !formData.mobileNumber ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    // ==============================
    // EMAIL VALIDATION
    // ==============================

    const emailRegex =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    // ==============================
    // MOBILE VALIDATION
    // ==============================

    if (formData.mobileNumber.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    // ==============================
    // PASSWORD VALIDATION
    // ==============================

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    // ==============================
    // CONFIRM PASSWORD
    // ==============================

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // ==============================
    // START LOADING
    // ==============================

    setLoading(true);

    try {
      // ==============================
      // BACKEND PAYLOAD
      // ==============================

      const payload = {
        FullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        MobileNumber: formData.mobileNumber,
      };

      console.log("Sending signup data:", payload);

      // ==============================
      // CALL REGISTER API
      // ==============================

      const response = await registerAPI(payload);

      console.log("Registration response:", response);

      // ==============================
      // IMPORTANT
      // ==============================
      // DO NOT SAVE TOKEN HERE.
      //
      // Signup only creates the account
      // and sends OTP.
      //
      // Token will be saved AFTER LOGIN.
      // ==============================

      // ==============================
      // GO TO OTP PAGE
      // ==============================

      navigate("/verify-otp", {
        state: {
          email: formData.email,
        },
      });

    } catch (err) {
      console.error("Registration error:", err);

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Registration failed. Please try again.";

      setError(message);

    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // RETURN
  // ==============================

  return {
    formData,

    handleChange,

    showPassword,
    setShowPassword,

    showConfirmPassword,
    setShowConfirmPassword,

    error,
    loading,

    handleSubmit,
  };
};