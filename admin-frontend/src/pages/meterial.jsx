import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./material.css";
import API from "../Api/axios";

const Material = () => {
  const navigate = useNavigate();

  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");

  // GET MATERIALS
  const fetchMaterials = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await API.get("/meterial");

      console.log("MATERIAL RESPONSE:", response.data);

      setMaterials(response.data.data || []);
    } catch (error) {
      console.error("MATERIAL LIST ERROR:", error);

      setErrorMessage(
        error?.response?.data?.message ||
        "Failed to load materials."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  // SEARCH - frontend filtering for now
  const filteredMaterials = materials.filter((material) =>
    material.MeterialName
      ?.toLowerCase()
      .includes(search.toLowerCase())
  );

  // ADD
  const handleAddMaterial = () => {
    navigate("/admin/material/add");
  };

  // EDIT
  const handleEdit = (id) => {
    navigate(`/admin/material/edit/${id}`);
  };

const handleDelete = async (id) => {
  try {
    await API.delete(`/meterial/delete/${id}`);

    fetchMaterials();
  } catch (error) {
    console.error("DELETE MATERIAL ERROR:", error);
  }
};
  return (
    <div className="material-page">

      {/* Header */}
      <div className="material-header">

        <div>
          <h2>Material Management</h2>
        </div>

        <button
          className="material-add-btn"
          onClick={handleAddMaterial}
        >
          + Add Material
        </button>

      </div>


      {/* Search */}
      <div className="material-search-section">

        <input
          type="text"
          placeholder="Search material..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {search && (
          <button
            className="material-clear-btn"
            onClick={() => setSearch("")}
          >
            Clear
          </button>
        )}

      </div>


      {/* Error */}
      {errorMessage && (
        <p className="material-error">
          {errorMessage}
        </p>
      )}


      {/* Table */}
      <div className="material-table-container">

        {loading ? (
          <p className="material-loading">
            Loading materials...
          </p>
        ) : (

          <table className="material-table">

            <thead>
              <tr>
                <th>Material ID</th>
                <th>Material Name</th>
                <th>Description</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Action</th>
              </tr>
            </thead>


            <tbody>

              {filteredMaterials.length > 0 ? (

                filteredMaterials.map((material) => (

                  <tr key={material._id}>

                    <td>
                      {material._id}
                    </td>

                    <td className="material-name">
                      {material.MeterialName}
                    </td>

                    <td>
                      {material.Description}
                    </td>

                    <td>

                      <span
                        className={
                          material.Status === "Active"
                            ? "material-status active"
                            : "material-status inactive"
                        }
                      >
                        {material.Status}
                      </span>

                    </td>

                    <td>
                      {material.createdAt
                        ? new Date(
                            material.createdAt
                          ).toLocaleDateString()
                        : "-"}
                    </td>

                    <td>

                      <div className="material-actions">

                        <button
                          className="material-edit-btn"
                          onClick={() =>
                            handleEdit(material._id)
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="material-delete-btn"
                          onClick={() =>
                            handleDelete(material._id)
                          }
                        >
                          Delete
                        </button>

                      </div>

                    </td>

                  </tr>

                ))

              ) : (

                <tr>
                  <td colSpan="6">
                    No materials found
                  </td>
                </tr>

              )}

            </tbody>

          </table>

        )}

      </div>


      {/* Pagination */}
      <div className="material-pagination">

        <button disabled>
          Previous
        </button>

        <button className="active">
          1
        </button>

        <button disabled>
          Next
        </button>

      </div>

    </div>
  );
};

export default Material;