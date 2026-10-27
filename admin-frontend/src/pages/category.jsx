import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./category.css";
import api from "../Api/axios";

import DeletePopup from "../combonent/deletepop";
import Pagination from "../combonent/pagination";

import {
  ListFilter,
  Pencil,
  Trash2
} from "lucide-react";

import Success from "../combonent/successpop";


function Category() {

  const navigate = useNavigate();


  // ==========================================
  // CATEGORY LIST
  // ==========================================

  const [categories, setCategories] = useState([]);


  // ==========================================
  // PAGINATION
  // ==========================================

  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);


  // ==========================================
  // SHOW / HIDE ADD FORM
  // ==========================================

  const [showForm, setShowForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);


  // ==========================================
  // FORM DATA
  // ==========================================

  const [formData, setFormData] = useState({
    categoryName: "",
    description: "",
    status: "Active",
    image: null,
  });


  // ==========================================
  // IMAGE PREVIEW
  // ==========================================

  const [imagePreview, setImagePreview] = useState(null);


  // ==========================================
  // LOADING
  // ==========================================

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);


  // ==========================================
  // ERROR
  // ==========================================

  const [errorMessage, setErrorMessage] = useState("");


  // ==========================================
  // SEARCH
  // ==========================================

  const [search, setSearch] = useState("");


  // ==========================================
  // SORT / FILTER
  // ==========================================

  const [showSort, setShowSort] = useState(false);
  const [sortOrder, setSortOrder] = useState(null);


  // ==========================================
  // GET PAGINATED CATEGORIES
  // ==========================================

  const fetchCategories = async () => {

    try {

      setLoading(true);

      const response = await api.get(
        "/admin/category/pagination",
        {
          params: {
            page,
            limit
          }
        }
      );

      console.log(
        "CATEGORY PAGINATION RESPONSE:",
        response.data
      );

      setCategories(
        response.data.data || []
      );

      setTotalPages(
        response.data.totalPages || 1
      );

    } catch (error) {

      console.error(
        "CATEGORY LIST ERROR:",
        error
      );

      setErrorMessage(
        error?.response?.data?.message ||
        "Failed to load categories."
      );

    } finally {

      setLoading(false);

    }

  };


  // ==========================================
  // FETCH WHEN PAGE CHANGES
  // ==========================================

  useEffect(() => {

    fetchCategories();

  }, [page]);


  // ==========================================
  // SEARCH CATEGORY
  // ==========================================

  const handleSearch = async (e) => {

    const value = e.target.value;

    setSearch(value);

    try {

      // If search is empty
      // get paginated categories again

      if (!value.trim()) {

        setPage(1);

        return;

      }

      const response = await api.get(
        "/admin/category/search",
        {
          params: {
            search: value
          }
        }
      );

      console.log(
        "CATEGORY SEARCH RESPONSE:",
        response.data
      );

      setCategories(
        response.data.data || response.data
      );

    } catch (error) {

      console.error(
        "CATEGORY SEARCH ERROR:",
        error
      );

      setErrorMessage(
        error?.response?.data?.message ||
        "Failed to search categories."
      );

    }

  };


  // ==========================================
  // FILTER / SORT CATEGORY
  // ==========================================

  const handleSort = async (sort) => {

    try {

      setLoading(true);

      const response = await api.get(
        "/admin/category/filter",
        {
          params: {
            sort
          }
        }
      );

      console.log(
        "CATEGORY SORT RESPONSE:",
        response.data
      );

      setCategories(
        response.data.data || []
      );

      setSortOrder(sort);
      setShowSort(false);

    }

    catch (error) {

      console.log(
        "STATUS:",
        error.response?.status
      );

      console.log(
        "BACKEND ERROR:",
        error.response?.data
      );

      console.log(
        "FULL ERROR:",
        error
      );

    }

    finally {

      setLoading(false);

    }

  };


  // ==========================================
  // CLEAR SEARCH
  // ==========================================

  const handleClearSearch = () => {

    setSearch("");

    setPage(1);

  };


  // ==========================================
  // INPUT CHANGE
  // ==========================================

  const handleChange = (e) => {

    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

  };


  // ==========================================
  // IMAGE CHANGE
  // ==========================================

  
const handleImageChange = (e) => {
  const file = e.target.files[0];

  if (!file) {
    return;
  }

  // Allow only image files
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  const allowedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
  ];

  const extension = file.name
    .substring(file.name.lastIndexOf("."))
    .toLowerCase();

  // Validate image type
 if (
  !allowedTypes.includes(file.type) ||
  !allowedExtensions.includes(extension)
) {
  setErrorMessage(
    "Only JPG, JPEG, PNG and WEBP images are allowed."
  );

  e.target.value = "";
  setFormData((previous) => ({
    ...previous,
    image: null,
  }));
  setImagePreview(null);

  return;
}

  // Validate image size (2 MB)
  if (file.size > 2 * 1024 * 1024) {
    setErrorMessage("Image size must not exceed 2 MB.");

    e.target.value = "";
    return;
  }

  // Valid image
  setErrorMessage("");

  setFormData((previous) => ({
    ...previous,
    image: file,
  }));

  setImagePreview(URL.createObjectURL(file));
};


  // ==========================================
  // SAVE CATEGORY
  // ==========================================

  const handleSubmit = async (e) => {

    e.preventDefault();

    setErrorMessage("");


    // ========================================
    // VALIDATION
    // ========================================

    if (!formData.categoryName.trim()) {

      setErrorMessage(
        "Category name is required."
      );

      return;

    }


    if (!formData.description.trim()) {

      setErrorMessage(
        "Description is required."
      );

      return;

    }


    if (!formData.image) {

      setErrorMessage(
        "Category image is required."
      );

      return;

    }


    setSaving(true);

    try {


      // ======================================
      // FORM DATA
      // ======================================

      const data = new FormData();

      data.append(
        "categoryName",
        formData.categoryName.trim()
      );

      data.append(
        "description",
        formData.description.trim()
      );

      data.append(
        "status",
        formData.status
      );

      data.append(
        "image",
        formData.image
      );


      // ======================================
      // POST CATEGORY
      // ======================================

      const response = await api.post(
        "/admin/category",
        data
      );

      console.log(
        "CATEGORY CREATE RESPONSE:",
        response.data
      );

      setShowSuccess(true);


      // ======================================
      // RESET FORM
      // ======================================

      setFormData({
        categoryName: "",
        description: "",
        status: "Active",
        image: null,
      });

      setImagePreview(null);


      // ======================================
      // HIDE FORM
      // ======================================

      setShowForm(false);


      // ======================================
      // GET UPDATED CATEGORY LIST
      // ======================================

      setPage(1);

    } catch (error) {

      console.error(
        "CATEGORY CREATE ERROR:",
        error
      );

      setErrorMessage(
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create category."
      );

    } finally {

      setSaving(false);

    }

  };


  // ==========================================
  // CANCEL FORM
  // ==========================================

  const handleCancel = () => {

    setShowForm(false);

    setFormData({
      categoryName: "",
      description: "",
      status: "Active",
      image: null,
    });

    setImagePreview(null);

    setErrorMessage("");

  };


  // ==========================================
  // DELETE POPUP STATES
  // ==========================================

  const [deleteId, setDeleteId] = useState(null);

  const [showDeletePopup, setShowDeletePopup] = useState(false);


  // ==========================================
  // OPEN DELETE POPUP
  // ==========================================

  const handleDeleteClick = (id) => {

    setDeleteId(id);

    setShowDeletePopup(true);

  };


  // ==========================================
  // DELETE CATEGORY
  // ==========================================

  const handleDelete = async () => {

    try {

      await api.delete(
        `/admin/category/delete/${deleteId}`
      );

      setShowDeletePopup(false);

      setDeleteId(null);

      fetchCategories();

    } catch (error) {

      console.error(
        "CATEGORY DELETE ERROR:",
        error
      );

      alert(
        error?.response?.data?.message ||
        "Failed to delete category."
      );

    }

  };


  // ==========================================
  // CANCEL DELETE
  // ==========================================

  const handleCancelDelete = () => {

    setShowDeletePopup(false);

    setDeleteId(null);

  };


  // ==========================================
  // UI
  // ==========================================

  return (

    <div className="category-page">


      {showSuccess && (

        <Success
          message="Category created successfully!"
          onClose={() => setShowSuccess(false)}
        />

      )}


      <div className="category-header">

        <h2>
          Category
        </h2>

        <button
          className="create-category-btn"
          onClick={() =>
            navigate("/admin/categories/add")
          }
        >
          Create Category
        </button>

      </div>


      {/* =====================================
          ADD CATEGORY FORM
      ===================================== */}

      {showForm && (

        <div className="category-form-card">

          <h3>
            Create Category
          </h3>

          <form
            onSubmit={handleSubmit}
          >


            {/* CATEGORY NAME */}

            <div className="category-form-group">

              <label>
                Category Name
              </label>

              <input
                type="text"
                name="categoryName"
                value={formData.categoryName}
                onChange={handleChange}
                placeholder="Enter category name"
              />

            </div>


            {/* DESCRIPTION */}

            <div className="category-form-group">

              <label>
                Description
              </label>

              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter category description"
                rows="4"
              />

            </div>


            {/* STATUS */}

            <div className="category-form-group">

              <label>
                Status
              </label>

              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >

                <option value="Active">
                  Active
                </option>

                <option value="Inactive">
                  Inactive
                </option>

              </select>

            </div>


            {/* IMAGE */}

            <div className="category-form-group">

              <label>
                Image
              </label>
<input
  type="file"
  accept=".jpg,.jpeg,.png,.webp"
  onChange={handleImageChange}
/>

              <small>
                Upload image (JPG, PNG) — Max 2MB
              </small>

            </div>


            {/* IMAGE PREVIEW */}

            {imagePreview && (

              <div className="category-image-preview">

                <img
                  src={imagePreview}
                  alt="Category Preview"
                />

              </div>

            )}


            {/* ERROR */}

            {errorMessage && (

              <p className="category-error">
                {errorMessage}
              </p>

            )}


            {/* BUTTONS */}

            <div className="category-form-actions">

              <button
                type="submit"
                className="save-category-btn"
                disabled={saving}
              >

                {saving
                  ? "Saving..."
                  : "Save"
                }

              </button>


              <button
                type="button"
                className="cancel-category-btn"
                onClick={handleCancel}
                disabled={saving}
              >

                Cancel

              </button>

            </div>

          </form>

        </div>

      )}


      {/* =====================================
          CATEGORY TABLE
      ===================================== */}

      {!showForm && (

        <div className="category-table-card">


          {/* =================================
              SEARCH
          ================================= */}

          <div className="category-search">

            <input
              type="text"
              placeholder="Search category..."
              value={search}
              onChange={handleSearch}
            />

            {search && (

              <button
                type="button"
                onClick={handleClearSearch}
              >
                Clear
              </button>

            )}


            <div className="category-sort-container">

              <button
                type="button"
                className="category-filter-btn"
                onClick={() =>
                  setShowSort(!showSort)
                }
                title="Sort categories"
              >

                <ListFilter size={20} />

              </button>


              {showSort && (

                <div className="category-sort-menu">

                  <button
                    type="button"
                    className={
                      sortOrder === 1
                        ? "selected"
                        : ""
                    }
                    onClick={() =>
                      handleSort(1)
                    }
                  >
                    A - Z
                  </button>


                  <button
                    type="button"
                    className={
                      sortOrder === -1
                        ? "selected"
                        : ""
                    }
                    onClick={() =>
                      handleSort(-1)
                    }
                  >
                    Z - A
                  </button>

                </div>

              )}

            </div>

          </div>


          {loading ? (

            <p className="category-loading">
              Loading categories...
            </p>

          ) : categories.length === 0 ? (

            <p className="category-empty">
              No categories found.
            </p>

          ) : (

            <>

              <div className="category-table-wrapper">

                <table className="category-table">

                  <thead>

                    <tr>

                      <th>
                        Category ID
                      </th>

                      <th>
                        Category Name
                      </th>

                      <th>
                        Description
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        Created Date
                      </th>

                      <th>
                        Action
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {categories.map(
                      (category, index) => (

                        <tr
                          key={category._id}
                        >

                          <td>
                            {(page - 1) *
                              limit +
                              index +
                              1}
                          </td>


                          <td>
                            {category.categoryName}
                          </td>


                          <td>
                            {category.description}
                          </td>


                          <td>

                            <span
                              className={
                                category.status ===
                                "Active"
                                  ? "status-active"
                                  : "status-inactive"
                              }
                            >
                              {category.status}
                            </span>

                          </td>


                          <td>

                            {category.createdAt
                              ? new Date(
                                  category.createdAt
                                ).toLocaleDateString()
                              : "-"}

                          </td>


                          {/* ACTION */}

                          <td>

                            <div className="category-action-buttons">

                              <button
                                className="edit-btn"
                                type="button"
                                onClick={() =>
                                  navigate(
                                    `/admin/category/edit/${category._id}`
                                  )
                                }
                                title="Edit"
                              >

                                <Pencil size={17} />

                              </button>


                              <button
                                className="delete-btn"
                                type="button"
                                onClick={() =>
                                  handleDeleteClick(
                                    category._id
                                  )
                                }
                                title="Delete"
                              >

                                <Trash2 size={17} />

                              </button>

                            </div>

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>


              {/* =================================
                  PAGINATION
              ================================= */}

              <Pagination
                page={page}
                setPage={setPage}
                totalPages={totalPages}
              />

            </>

          )}

        </div>

      )}


      {/* =====================================
          DELETE POPUP
      ===================================== */}

      {showDeletePopup && (

        <DeletePopup
          onConfirm={handleDelete}
          onCancel={handleCancelDelete}
        />

      )}

    </div>

  );

}

export default Category;