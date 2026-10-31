
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../Api/axios";
import "./categoryAdd.css";
import Success from "../combonent/successpop";

function Addcategory() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    categoryName: "",
    description: "",
    status: "Active",
    image: null,
    isHomeBanner: false,
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

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

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage("Image size must not exceed 2 MB.");

      e.target.value = "";
      setFormData((previous) => ({
        ...previous,
        image: null,
      }));
      setImagePreview(null);
      return;
    }

    setErrorMessage("");

    setFormData((previous) => ({
      ...previous,
      image: file,
    }));

    setImagePreview(URL.createObjectURL(file));
  };

  const handleBannerChange = (e) => {
    setFormData((previous) => ({
      ...previous,
      isHomeBanner: e.target.value === "true",
    }));
  };

  // GET EXISTING CATEGORIES AND CHECK DUPLICATES
  const checkDuplicateCategory = async (categoryName) => {
    const response = await api.get("/admin/category");

    const responseData = response.data;

    const categories = Array.isArray(responseData)
      ? responseData
      : Array.isArray(responseData?.data)
      ? responseData.data
      : Array.isArray(responseData?.categories)
      ? responseData.categories
      : [];

    const normalizedName = categoryName.trim().toLowerCase();

    return categories.some(
      (category) =>
        String(category.categoryName || "")
          .trim()
          .toLowerCase() === normalizedName
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving) return;

    setErrorMessage("");

    if (!formData.categoryName.trim()) {
      setErrorMessage("Category name is required.");
      return;
    }

    if (!formData.description.trim()) {
      setErrorMessage("Description is required.");
      return;
    }

    setSaving(true);

    try {
      // CHECK DUPLICATE CATEGORY BEFORE SAVING
      const isDuplicate = await checkDuplicateCategory(
        formData.categoryName
      );

      if (isDuplicate) {
        setErrorMessage(
          "This category name already exists. Please use another name."
        );
        return;
      }

      const data = new FormData();

      data.append(
        "categoryName",
        formData.categoryName.trim()
      );

      data.append(
        "description",
        formData.description.trim()
      );

      data.append("status", formData.status);

      if (formData.image) {
        data.append("image", formData.image);
      }

      data.append(
        "isHomeBanner",
        String(formData.isHomeBanner)
      );

      const response = await api.post(
        "/admin/category",
        data
      );

      console.log(
        "CATEGORY CREATE RESPONSE:",
        response.data
      );

      setShowSuccess(true);
    } catch (error) {
      console.error("CATEGORY CREATE ERROR:", error);

      setErrorMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to create category."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/categories");
  };

  return (
    <div className="add-category-page">
      {showSuccess && (
        <Success
          message="Category created successfully!"
          onClose={() => {
            setShowSuccess(false);
            navigate("/admin/categories");
          }}
        />
      )}

      <div className="add-category-header">
        <h2>Create Category</h2>
        <p>Add a new product category</p>
      </div>

      <div className="add-category-card">
        <form
          onSubmit={handleSubmit}
          className="add-category-form"
        >
          {/* CATEGORY NAME */}
          <div className="category-form-group">
            <label>Category Name</label>

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
            <label>Description</label>

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
            <label>Status</label>

            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* CATEGORY IMAGE */}
          <div className="category-image-section">
            <div className="category-image-heading">
              <h3>Category Image</h3>

              <p>
                This image will be used for the category and
                Home page banner.
              </p>
            </div>

            <div className="category-upload-box">
              <label>Upload Category Image</label>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
              />

              <small>JPG, PNG or WEBP — Max 2MB</small>
            </div>

            {imagePreview && (
              <div className="category-image-preview">
                <p>Category Image Preview</p>

                <img
                  src={imagePreview}
                  alt="Category Preview"
                />
              </div>
            )}
          </div>

          {/* HOME BANNER */}
          <div className="category-form-group">
            <label>Banner</label>

            <select
              name="isHomeBanner"
              value={String(formData.isHomeBanner)}
              onChange={handleBannerChange}
            >
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>

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
              {saving ? "Saving..." : "Save"}
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
    </div>
  );
}

export default Addcategory;
