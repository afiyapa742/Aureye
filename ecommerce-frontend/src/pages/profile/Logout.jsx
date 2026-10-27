import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Logout.css";

function Logout() {
  const navigate = useNavigate();
  const auth = useAuth();

  const [showPopup, setShowPopup] = useState(false);

  // ==========================================
  // OPEN CONFIRMATION POPUP
  // ==========================================

  const handleLogoutClick = () => {
    setShowPopup(true);
  };

  // ==========================================
  // CANCEL LOGOUT
  // ==========================================

  const handleCancel = () => {
    setShowPopup(false);
  };

  // ==========================================
  // CONFIRM LOGOUT
  // ==========================================

  const handleConfirmLogout = () => {
    // Clear login data
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Clear auth context
    if (auth && auth.logout) {
      auth.logout();
    }

    // Go to login page
    navigate("/login", {
      replace: true,
    });
  };

  return (
    <>
      {/* ==========================================
          LOGOUT PAGE
      ========================================== */}

      <div className="logout-container">

        <div className="logout-card">

          {/* ======================================
              MESSAGE
          ====================================== */}

          <p className="logout-message">
            We appreciate your time with us. Don't
            forget to come back when you're thirsty!
            We look forward to helping you with your
            next purchase.
          </p>


          {/* ======================================
              HEADING
          ====================================== */}

          <h3 className="logout-heading">
            Have a great day!
          </h3>


          {/* ======================================
              LOGOUT ILLUSTRATION
          ====================================== */}

          <div className="logout-illustration">

            <svg
              width="180"
              height="180"
              viewBox="0 0 200 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >

              {/* Door Frame */}

              <rect
                x="50"
                y="30"
                width="60"
                height="130"
                stroke="#333"
                strokeWidth="3"
                fill="none"
              />


              {/* Door Handle */}

              <circle
                cx="102"
                cy="95"
                r="4"
                fill="#395B83"
              />


              {/* Person Head */}

              <circle
                cx="130"
                cy="70"
                r="12"
                fill="#395B83"
              />


              {/* Person Body */}

              <path
                d="M110 140 C110 100, 150 100, 150 140"
                fill="#395B83"
              />


              {/* Legs */}

              <path
                d="M120 140 L120 165"
                stroke="#333"
                strokeWidth="3"
              />

              <path
                d="M140 140 L140 165"
                stroke="#333"
                strokeWidth="3"
              />


              {/* Plant Pot */}

              <path
                d="M160 145 L170 145 L167 160 L163 160 Z"
                fill="#333"
              />


              {/* Plant */}

              <circle
                cx="165"
                cy="140"
                r="6"
                fill="#333"
              />

            </svg>

          </div>


          {/* ======================================
              LOGOUT BUTTON
          ====================================== */}

          <button
            type="button"
            className="logout-action-btn"
            onClick={handleLogoutClick}
          >
            Logout out
          </button>

        </div>

      </div>


      {/* ==========================================
          CONFIRMATION POPUP
      ========================================== */}

      {showPopup && (

        <div
          className="logout-popup-overlay"
          onClick={handleCancel}
        >

          <div
            className="logout-popup"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* ==================================
                POPUP ICON
            ================================== */}

            <div className="logout-popup-icon">
              !
            </div>


            {/* ==================================
                POPUP TITLE
            ================================== */}

            <h2>
              Are you sure?
            </h2>


            {/* ==================================
                POPUP MESSAGE
            ================================== */}

            <p>
              Are you sure you want to logout
              from your account?
            </p>


            {/* ==================================
                POPUP BUTTONS
            ================================== */}

            <div className="logout-popup-actions">

              {/* CANCEL */}

              <button
                type="button"
                className="logout-cancel-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>


              {/* CONFIRM */}

              <button
                type="button"
                className="logout-confirm-btn"
                onClick={handleConfirmLogout}
              >
                Yes, Logout
              </button>

            </div>

          </div>

        </div>

      )}

    </>
  );
}

export default Logout;