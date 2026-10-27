import React from "react";
import "./Success.css";

const Success = ({ message, onClose }) => {
  return (
    <div className="success-overlay">

      <div className="success-popup">

        <div className="success-icon">
          ✓
        </div>

        <h2>Success!</h2>

        <p>{message}</p>

        <button
          className="success-ok-btn"
          onClick={onClose}
        >
          OK
        </button>

      </div>

    </div>
  );
};

export default Success;