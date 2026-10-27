import "./delete.css";

const DeletePopup = ({ user, onCancel, onConfirm, loading }) => {

  if (!user) {
    return null;
  }

  return (
    <div className="popup-overlay">

      <div className="delete-popup">

        <h2>Delete User?</h2>

        <p>
          Are you sure you want to delete
          <strong> {user.FullName}</strong>?
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