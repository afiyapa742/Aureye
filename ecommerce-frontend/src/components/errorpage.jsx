import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import "./ErrorPage.css";

const ErrorPage = ({
  title = "Something went wrong",
  message = "We couldn't load this page. Please try again.",
  showHome = true,
}) => {
  const navigate = useNavigate();

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="error-page">
      <div className="error-card">

        <div className="error-icon">
          <AlertTriangle size={55} />
        </div>

        <h1>{title}</h1>

        <p>{message}</p>

        <div className="error-buttons">

          <button
            type="button"
            className="error-retry-btn"
            onClick={handleRetry}
          >
            <RefreshCw size={18} />
            Try Again
          </button>

          {showHome && (
            <button
              type="button"
              className="error-home-btn"
              onClick={() => navigate("/home")}
            >
              <Home size={18} />
              Go Home
            </button>
          )}

        </div>

      </div>
    </div>
  );
};

export default ErrorPage;