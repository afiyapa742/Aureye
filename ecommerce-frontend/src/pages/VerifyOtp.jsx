
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  verifyOtpAPI,
  resendOtpAPI,
  verifyForgotPasswordOtpAPI,
} from "../service/Authservice";
import "./VerifyOtp.css";

const VerifyOtp = () => {
  // ==========================================
  // 6 DIGIT OTP
  // ==========================================

  const [otp, setOtp] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  const [timer, setTimer] = useState(59);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputRefs = useRef([]);

  const location = useLocation();
  const navigate = useNavigate();

  // ==========================================
  // EMAIL
  // ==========================================

  const userEmail = location.state?.email || "";

  // ==========================================
  // CHECK OTP TYPE
  // ==========================================

  const isForgotPassword =
    location.state?.isForgotPassword === true;

  // ==========================================
  // NO EMAIL
  // ==========================================

  useEffect(() => {
    if (!userEmail) {
      navigate("/login", {
        replace: true,
      });
    }
  }, [userEmail, navigate]);

  // ==========================================
  // TIMER
  // ==========================================

  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  // ==========================================
  // OTP INPUT
  // ==========================================

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) {
      return;
    }

    const newOtp = [...otp];

    newOtp[index] = value.slice(-1);

    setOtp(newOtp);

    setError("");

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // ==========================================
  // BACKSPACE
  // ==========================================

  const handleKeyDown = (index, e) => {
    if (
      e.key === "Backspace" &&
      !otp[index] &&
      index > 0
    ) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // ==========================================
  // RESEND OTP
  // ==========================================

  const handleResend = async () => {
    if (!canResend) {
      return;
    }

    try {
      setError("");
      setLoading(true);

      await resendOtpAPI({
        email: userEmail,
      });

      setOtp([
        "",
        "",
        "",
        "",
        "",
        "",
      ]);

      setTimer(59);
      setCanResend(false);

      inputRefs.current[0]?.focus();

    } catch (err) {
      console.error(
        "Resend OTP error:",
        err
      );

      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to resend OTP"
      );

    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // VERIFY OTP
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    const fullOtp = otp.join("");

    // ==========================================
    // CHECK 6 DIGITS
    // ==========================================

    if (fullOtp.length !== 6) {
      setError(
        "Please enter complete 6-digit verification code."
      );
      return;
    }

    try {
      setLoading(true);

      // ==========================================
      // FORGOT PASSWORD OTP
      // ==========================================

      if (isForgotPassword) {
        try {
          // IMPORTANT:
          // Verify OTP with backend FIRST.
          // Do NOT navigate directly to reset password.

          const response =
            await verifyForgotPasswordOtpAPI({
              email: userEmail,
              otp: fullOtp,
            });

          console.log(
            "FORGOT PASSWORD OTP RESPONSE:",
            response
          );

          // Only after successful verification
          // go to Reset Password

          navigate("/reset-password", {
            state: {
              email: userEmail,
              otp: fullOtp,
            },
          });

          return;

        } catch (err) {
          console.error(
            "FORGOT PASSWORD OTP ERROR:",
            err
          );

          setError(
            err?.response?.data?.message ||
            err?.message ||
            "Invalid OTP"
          );

          return;
        }
      }

      // ==========================================
      // SIGNUP OTP
      // ==========================================

      const response = await verifyOtpAPI({
        email: userEmail,
        otp: fullOtp,
      });

      console.log(
        "OTP verification response:",
        response
      );

      // ==========================================
      // SAVE TOKEN AFTER SIGNUP
      // ==========================================

      if (response?.token) {
        localStorage.setItem(
          "token",
          response.token
        );
      }

      // ==========================================
      // SAVE USER
      // ==========================================

      if (response) {
        localStorage.setItem(
          "user",
          JSON.stringify({
            _id: response._id,
            FullName: response.FullName,
            email: response.email,
            MobileNumber:
              response.MobileNumber,
          })
        );
      }

      alert(
        "OTP Verified Successfully!"
      );

      // Signup → Login

      navigate("/login", {
        replace: true,
      });

    } catch (err) {
      console.error(
        "OTP verification error:",
        err
      );

      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Invalid OTP code"
      );

    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="otp-page">

      <main className="otp-card">

        <h1 className="otp-title">
          Verify OTP
        </h1>

        <p className="otp-subtitle">
          We've sent an email with an activation
          <br />
          code to your email

          <span className="otp-email-highlight">
            {" "}
            {userEmail}
          </span>
        </p>

        <form
          onSubmit={handleSubmit}
          noValidate
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >

          {/* ==================================
              6 OTP BOXES
          ================================== */}

          <div className="otp-inputs-container">

            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}

                ref={(el) => {
                  inputRefs.current[index] = el;
                }}

                onChange={(e) =>
                  handleChange(
                    index,
                    e.target.value
                  )
                }

                onKeyDown={(e) =>
                  handleKeyDown(
                    index,
                    e
                  )
                }

                className="otp-box"

                autoFocus={index === 0}
              />
            ))}

          </div>

          {/* ==================================
              TIMER
          ================================== */}

          <p className="otp-timer">

            Send code again{" "}

            {timer < 10
              ? `00:0${timer}`
              : `00:${timer}`}

          </p>

          {/* ==================================
              RESEND
          ================================== */}

          <p className="otp-resend-wrap">

            I didn't receive a code{" "}

            <button
              type="button"
              className="otp-resend-btn"
              onClick={handleResend}
              disabled={
                !canResend ||
                loading
              }
            >
              Resend
            </button>

          </p>

          {/* ==================================
              VERIFY BUTTON
          ================================== */}

          <button
            type="submit"
            className="otp-submit"
            disabled={loading}
          >
            {loading
              ? "Verifying..."
              : "Verify"}
          </button>

          {/* ==================================
              ERROR
          ================================== */}

          {error && (
            <p
              className="otp-error"
              role="alert"
            >
              {error}
            </p>
          )}

        </form>

      </main>

    </div>
  );
};

export default VerifyOtp;