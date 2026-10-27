import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./meterial.css";
import api from "../Api/axios";

const EditMeterial = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [MeterialName, setMeterialName] = useState("");
  const [Description, setDescription] = useState("");
  const [Status, setStatus] = useState("Active");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        const response = await api.get("/meterial");

        const material = response.data.data.find(
          (item) => item._id === id
        );

        if (!material) {
          setErrorMessage("Material not found");
          return;
        }

        setMeterialName(material.MeterialName);
        setDescription(material.Description);
        setStatus(material.Status);
      } catch (error) {
        console.error("GET MATERIAL ERROR:", error);

        setErrorMessage(
          error?.response?.data?.message ||
          "Failed to load material."
        );
      }
    };

    fetchMaterial();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setErrorMessage("");

      const updatedData = {
        MeterialName,
        Description,
        Status
      };

      await api.put(
        `/meterial/update/${id}`,
        updatedData
      );

      navigate("/admin/material");
    } catch (error) {
      console.error("UPDATE MATERIAL ERROR:", error);

      setErrorMessage(
        error?.response?.data?.message ||
        "Failed to update material."
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
        <h2>Edit Material</h2>
        <p>Update material details</p>
      </div>

      <div className="add-meterial-card">

        {errorMessage && (
          <p className="add-meterial-error">
            {errorMessage}
          </p>
        )}

        <form onSubmit={handleSubmit}>

          <div className="add-meterial-field">
            <label>Material Name</label>

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

          <div className="add-meterial-field">
            <label>Description</label>

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

          <div className="add-meterial-field">
            <label>Status</label>

            <select
              value={Status}
              onChange={(e) =>
                setStatus(e.target.value)
              }
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

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
              {loading ? "Updating..." : "Update Material"}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
};

export default EditMeterial;