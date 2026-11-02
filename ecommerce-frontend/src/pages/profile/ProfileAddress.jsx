import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEdit3 } from 'react-icons/fi';
import './ProfileAddress.css';
import API from "../../api/axios";
function ProfileAddress() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // ==========================================
  // FETCH ADDRESSES
  // ==========================================

const fetchAddresses = async () => {
  try {
    const response = await API.get("/auth/address");

    console.log("ADDRESS RESPONSE:", response.data);

    const data = response.data;

    if (Array.isArray(data)) {
      setAddresses(data);
    } else {
      setAddresses(data.addresses || []);
    }

  } catch (err) {
    console.error("Error fetching addresses:", err);
    setAddresses([]);

  } finally {
    setLoading(false);
  }
};

  // ==========================================
  // LOAD ADDRESSES
  // ==========================================

  useEffect(() => {
    fetchAddresses();
  }, []);

  // ==========================================
  // DELETE ADDRESS
  // ==========================================
const handleDelete = async (id) => {
  if (
    !window.confirm(
      "Are you sure you want to delete this address?"
    )
  ) {
    return;
  }

  try {
    const response = await API.delete(
      `/auth/address/${id}`
    );

    console.log(
      "DELETE ADDRESS RESPONSE:",
      response.data
    );

    setAddresses((prev) =>
      prev.filter((addr) => addr._id !== id)
    );

  } catch (err) {
    console.error("DELETE ADDRESS ERROR:", err);

    alert(
      err.response?.data?.message ||
      err.message ||
      "Failed to delete address"
    );
  }
};

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="address-content-card">
        <p>Loading addresses...</p>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="delivery-address-container">

      {/* ======================================
          BREADCRUMB
      ====================================== */}

      <div className="address-breadcrumb">

        <span>
          Profile
        </span>

        {' '}&gt;{' '}

        <span className="active">
          delivery address
        </span>

        {' '}&gt;

      </div>


      {/* ======================================
          CONTENT CARD
      ====================================== */}

      <div className="address-content-card">

        <h2 className="address-title">
          Delivery Address
        </h2>


        {/* ====================================
            NO ADDRESS
        ==================================== */}

        {addresses.length === 0 ? (

          <p className="no-address-text">
            No addresses saved yet. Click below
            to add one.
          </p>

        ) : (

          /* ==================================
             ADDRESS CARDS
          ================================== */

          <div className="address-cards-grid">

            {addresses.map((addr) => (

              <div
                key={addr._id}
                className="single-address-card"
              >

                {/* ==============================
                    TOP ROW
                ============================== */}

                <div className="card-top-row">

                  <h3 className="user-name">
                    {addr.FullName}
                  </h3>


                  <button
                    type="button"
                    className="icon-edit-btn"
                    onClick={() =>
                      navigate(
                        `/profile/address/edit/${addr._id}`,
                        {
                          state: {
                            address: addr
                          }
                        }
                      )
                    }
                  >

                    <FiEdit3 size={18} />

                  </button>

                </div>


                {/* ==============================
                    ADDRESS
                ============================== */}

                <p className="address-line">
                  {addr.address}
                </p>


                {/* ==============================
                    LANDMARK
                ============================== */}

                {addr.landmark && (

                  <p className="address-line">
                    Landmark: {addr.landmark}
                  </p>

                )}


                {/* ==============================
                    ADDRESS DETAILS
                ============================== */}

                <div className="address-block">

                  <p>
                    {addr.city},{' '}
                    {addr.district}
                  </p>

                  <p>
                    {addr.pincode}
                  </p>

                  <p>
                    {addr.state}, India
                  </p>

                  <p className="phone-line">
                    Ph: {addr.MobileNumber}
                  </p>

                </div>


                {/* ==============================
                    BOTTOM ROW
                ============================== */}

                <div className="card-bottom-row">

                  {addr.isDefault ? (

                    <span className="default-tag">
                      Default
                    </span>

                  ) : (

                    <div />

                  )}


                  <button
                    type="button"
                    className="delete-address-btn"
                    onClick={() =>
                      handleDelete(addr._id)
                    }
                  >
                    DELETE
                  </button>

                </div>

              </div>

            ))}

          </div>

        )}


        {/* ======================================
            ADD ADDRESS BUTTON
        ====================================== */}

        <div className="add-btn-wrapper">

          <button
            type="button"
            className="add-new-address-btn"
            onClick={() =>
              navigate('/profile/address/add')
            }
          >
            Add New Address
          </button>

        </div>

      </div>

    </div>
  );
}

export default ProfileAddress;