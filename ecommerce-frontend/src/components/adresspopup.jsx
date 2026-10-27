import React, { useEffect, useState } from "react";
import { X, MapPin, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import "./AddressPopup.css";

const AddressPopup = ({
  onClose,
  onSelectAddress,
  selectedAddress,
}) => {
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // FETCH USER ADDRESSES
  // ==========================================

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const response = await API.get("/auth/address");

        console.log(
          "ADDRESS RESPONSE:",
          response.data
        );

        // Backend returns addresses directly
        // res.status(200).json(addresses)
        setAddresses(response.data || []);

      } catch (error) {
        console.error(
          "ADDRESS FETCH ERROR:",
          error
        );

        console.error(
          "ADDRESS ERROR RESPONSE:",
          error.response?.data
        );

        console.error(
          "ADDRESS ERROR STATUS:",
          error.response?.status
        );

        setAddresses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, []);

  // ==========================================
  // SELECT ADDRESS
  // ==========================================

  const handleSelect = (address) => {
    onSelectAddress(address);
    onClose();
  };

  // ==========================================
  // ADD NEW ADDRESS
  // ==========================================

  const handleAddAddress = () => {
    onClose();
    navigate("/profile/address/add");
  };

  return (
    <div
      className="address-popup-overlay"
      onClick={onClose}
    >
      <div
        className="address-popup"
        onClick={(e) => e.stopPropagation()}
      >

        {/* =====================================
            HEADER
        ===================================== */}

        <div className="address-popup-header">

          <h2>
            Select Delivery Address
          </h2>

          <button
            className="address-close-btn"
            onClick={onClose}
          >
            <X size={22} />
          </button>

        </div>

        {/* =====================================
            ADDRESS CONTENT
        ===================================== */}

        <div className="address-popup-content">

          {loading ? (

            <p className="address-loading">
              Loading addresses...
            </p>

          ) : addresses.length === 0 ? (

            <div className="no-address">

              <MapPin size={35} />

              <p>
                No saved addresses found.
              </p>

              <button
                className="add-address-btn"
                onClick={handleAddAddress}
              >
                <Plus size={18} />
                Add New Address
              </button>

            </div>

          ) : (

            <>

              <div className="address-list">

                {addresses.map((address) => {

                  const addressId = address._id;

                  const isSelected =
                    selectedAddress?._id === addressId;

                  return (

                    <div
                      key={addressId}
                      className={`address-item ${
                        isSelected
                          ? "selected-address"
                          : ""
                      }`}
                      onClick={() =>
                        handleSelect(address)
                      }
                    >

                      {/* RADIO */}

                      <div className="address-radio">

                        <span
                          className={
                            isSelected
                              ? "radio-dot active"
                              : "radio-dot"
                          }
                        ></span>

                      </div>

                      {/* ADDRESS DETAILS */}

                      <div className="address-details">

                        <div className="address-top">

                          <h3>
                            {address.FullName}
                          </h3>

                          {address.isDefault && (

                            <span className="default-badge">
                              Default
                            </span>

                          )}

                        </div>

                        {/* ADDRESS */}

                        <p>
                          {address.address}
                        </p>

                        {/* LANDMARK */}

                        {address.landmark && (

                          <p>
                            {address.landmark}
                          </p>

                        )}

                        {/* CITY + DISTRICT */}

                        <p>
                          {address.city}
                          {address.district &&
                            `, ${address.district}`}
                        </p>

                        {/* STATE + PINCODE */}

                        <p>
                          {address.state} -{" "}
                          {address.pincode}
                        </p>

                        {/* MOBILE NUMBER */}

                        <p className="address-phone">
                          {address.MobileNumber}
                        </p>

                        {/* ADDRESS TYPE */}

                        {address.addressType && (

                          <span className="address-type">
                            {address.addressType}
                          </span>

                        )}

                      </div>

                    </div>

                  );

                })}

              </div>

              {/* =================================
                  ADD NEW ADDRESS
              ================================= */}

              <button
                className="add-address-btn bottom-add-btn"
                onClick={handleAddAddress}
              >

                <Plus size={18} />

                Add New Address

              </button>

            </>

          )}

        </div>

      </div>

    </div>
  );
};

export default AddressPopup;