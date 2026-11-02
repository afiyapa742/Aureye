import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import './addProfileAddress.css';
import API from  "../../api/axios";
function EditAddress() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addressId } = useParams();

  const address = location.state?.address;

  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    FullName: address?.FullName || '',
    MobileNumber: address?.MobileNumber || '',
    address: address?.address || '',
    district: address?.district || '',
    state: address?.state || '',
    city: address?.city || '',
    pincode: address?.pincode || '',
    landmark: address?.landmark || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditSubmit = async (e) => {
  e.preventDefault();

  setSubmitting(true);

  try {
    const token = localStorage.getItem("token");

    await API.put(
      `/auth/address/${addressId}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    navigate("/profile/address");

  } catch (err) {
    alert(
      err.response?.data?.message ||
      err.message ||
      "Error updating address"
    );

  } finally {
    setSubmitting(false);
  }
};

  return (
    <div className="delivery-address-container">

      {/* Breadcrumb Navigation */}

      <div className="address-breadcrumb">

        <span>Profile</span> &gt;{' '}

        <span>delivery address</span> &gt;{' '}

        <span className="active">
          edit address
        </span> &gt;

      </div>


      {/* Main Form Content Card */}

      <div className="address-content-card">

        <form
          onSubmit={handleEditSubmit}
          className="add-address-form"
        >

          <div className="form-header">

            <h2>
              Edit Address
            </h2>

            <span className="personal-info-tag">
              Personal information
            </span>

          </div>


          {/* FULL NAME */}

          <div className="form-row">

            <div className="form-group">

              <label>
                Full name
              </label>

              <input
                type="text"
                name="FullName"
                placeholder="Afiya pa"
                value={formData.FullName}
                onChange={handleChange}
                required
              />

            </div>


            {/* MOBILE */}

            <div className="form-group">

              <label>
                Mobile Number
              </label>

              <input
                type="text"
                name="MobileNumber"
                placeholder="+91 000-000-000"
                value={formData.MobileNumber}
                onChange={handleChange}
                required
              />

            </div>

          </div>


          {/* ADDRESS */}

          <div className="form-group full-width">

            <label>
              Address
            </label>

            <input
              type="text"
              name="address"
              placeholder="House Name , House Number, Locality"
              value={formData.address}
              onChange={handleChange}
              required
            />

          </div>


          {/* DISTRICT + STATE */}

          <div className="form-row">

            <div className="form-group">

              <label>
                District
              </label>

              <input
                type="text"
                name="district"
                placeholder="eg : Kochi"
                value={formData.district}
                onChange={handleChange}
                required
              />

            </div>


            <div className="form-group">

              <label>
                State
              </label>

              <input
                type="text"
                name="state"
                placeholder="eg : Kerala"
                value={formData.state}
                onChange={handleChange}
                required
              />

            </div>

          </div>


          {/* CITY + PINCODE */}

          <div className="form-row">

            <div className="form-group">

              <label>
                City
              </label>

              <input
                type="text"
                name="city"
                placeholder="eg : Kaloor"
                value={formData.city}
                onChange={handleChange}
                required
              />

            </div>


            <div className="form-group">

              <label>
                Pin Code
              </label>

              <input
                type="text"
                name="pincode"
                placeholder="eg : 682017"
                value={formData.pincode}
                onChange={handleChange}
                required
              />

            </div>

          </div>


          {/* LANDMARK */}

          <div className="form-group full-width">

            <label>
              Landmark ( optional )
            </label>

            <input
              type="text"
              name="landmark"
              placeholder="eg : Hospital"
              value={formData.landmark}
              onChange={handleChange}
            />

          </div>


          {/* ACTIONS */}

          <div className="form-actions">

            <button
              type="button"
              className="cancel-btn"
              onClick={() =>
                navigate('/profile/address')
              }
            >
              Cancel
            </button>


            <button
              type="submit"
              className="save-address-btn"
              disabled={submitting}
            >

              {submitting
                ? 'Updating...'
                : 'Update Address'}

            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default EditAddress;