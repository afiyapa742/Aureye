import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPasswordAPI } from "../service/Authservice";
import "./ForgotPassword.css";

const ForgotPassword = () => {

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {

    e.preventDefault();

    setError("");

    const cleanEmail = email.trim();

    // ==========================================
    // EMAIL VALIDATION
    // ==========================================

    if (!cleanEmail) {

      setError(
        "Please enter your email address."
      );

      return;
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {

      setError(
        "Please enter a valid email address."
      );

      return;
    }

    try {

      setLoading(true);

      // ==========================================
      // SEND FORGOT PASSWORD OTP
      // ==========================================

      const response =
        await forgotPasswordAPI({
          email: cleanEmail,
        });

      console.log(
        "FORGOT PASSWORD RESPONSE:",
        response
      );

      // ==========================================
      // GO TO OTP PAGE
      // ==========================================

      navigate("/verify-otp", {
        state: {
          email: cleanEmail,
          isForgotPassword: true,
        },
      });

    } catch (err) {

      console.error(
        "FORGOT PASSWORD ERROR:",
        err
      );

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to send OTP.";

      setError(message);

    } finally {

      setLoading(false);

    }
  };


  return (
    <div className="forgot-page">

      <main className="forgot-card">

        <h1 className="forgot-title">
          Forgot Password?
        </h1>

        <p className="forgot-description">
          Enter your registered email address.
          We will send you an OTP to reset your password.
        </p>

        <form
          onSubmit={handleSubmit}
          noValidate
          style={{ width: "100%" }}
        >

          <div className="forgot-field">

            <label htmlFor="registered-email">
              Enter your registered email
            </label>

            <input
              id="registered-email"
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="helloworld@gmail.com"
              autoComplete="email"
              disabled={loading}
            />

          </div>


          {error && (
            <p
              className="forgot-error"
              role="alert"
            >
              {error}
            </p>
          )}


          <button
            type="submit"
            className="forgot-submit"
            disabled={loading}
          >

            {loading
              ? "Sending OTP..."
              : "Verify Email"}

          </button>

        </form>

      </main>

    </div>
  );
};

export default ForgotPassword;