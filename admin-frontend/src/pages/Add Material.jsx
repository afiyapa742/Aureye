import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./meterial.css";
import api from "../Api/axios";

const AddMeterial = () => {
  const navigate = useNavigate();

  const [MeterialName, setMeterialName] = useState("");
  const [Description, setDescription] = useState("");
  const [Status, setStatus] = useState("Active");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setErrorMessage("");

      const meterialdata = {
        MeterialName,
        Description,
        Status
      };

      const response = await api.post(
          "/meterial/addmeterial",
        meterialdata
      );

      console.log(
        "ADD MATERIAL RESPONSE:",
        response.data
      );

      navigate("/admin/material");

    } catch (error) {
      console.error(
        "ADD MATERIAL ERROR:",
        error
      );

      setErrorMessage(
        error?.response?.data?.message ||
        "Failed to add material."
      );

    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/material");
  };

  return (
    <div className="add-meterial-page">

      <div className="add-meterial-header">
        <h2>Add Material</h2>
        <p>Create a new material</p>
      </div>


      <div className="add-meterial-card">

        {errorMessage && (
          <p className="add-meterial-error">
            {errorMessage}
          </p>
        )}

        <form onSubmit={handleSubmit}>

          {/* Material Name */}
          <div className="add-meterial-field">

            <label>
              Material Name
            </label>

            <input
              type="text"
              placeholder="Enter material name"
              value={MeterialName}
              onChange={(e) =>
                setMeterialName(e.target.value)
              }
              required
            />

          </div>


          {/* Description */}
          <div className="add-meterial-field">

            <label>
              Description
            </label>

            <textarea
              placeholder="Enter material description"
              value={Description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              rows="5"
              required
            />

          </div>


          {/* Status */}
          <div className="add-meterial-field">

            <label>
              Status
            </label>

            <select
              value={Status}
              onChange={(e) =>
                setStatus(e.target.value)
              }
            >
              <option value="Active">
                Active
              </option>

              <option value="Inactive">
                Inactive
              </option>
            </select>

          </div>


          {/* Buttons */}
          <div className="add-meterial-actions">

            <button
              type="button"
              className="add-meterial-cancel"
              onClick={handleCancel}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="add-meterial-submit"
              disabled={loading}
            >
              {loading
                ? "Adding..."
                : "Add Material"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

export default AddMeterial;