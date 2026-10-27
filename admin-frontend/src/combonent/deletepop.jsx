import "./deletepop.css";

const DeletePopup = ({ onCancel, onConfirm, loading }) => {

  return (
    <div className="popup-overlay">

      <div className="delete-popup">

        <h2>Delete Category?</h2>

        <p>
          Are you sure you want to delete this category?
        </p>

        <div className="popup-buttons">

          <button
            className="cancel-btn"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            className="confirm-delete-btn"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>

        </div>

      </div>

    </div>
  );
};

export default DeletePopup;