
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./category.css";
import api from "../Api/axios";
import Success from "../combonent/successpop";

function EditCategory() {
  const navigate = useNavigate();
  const { id } = useParams();

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

  // GET CATEGORY
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const response = await api.get(
          `/admin/category/${id}`
        );

        console.log("CATEGORY RESPONSE:", response.data);

        const category =
          response.data.data || response.data;

        setFormData({
          categoryName: category.categoryName || "",
          description: category.description || "",
          status: category.status || "Active",
          image: null,
          isHomeBanner: category.isHomeBanner === true,
        });

        if (category.image) {
          setImagePreview(
            `http://localhost:5000/uploads/${category.image}`
          );
        }
      } catch (error) {
        console.error("CATEGORY FETCH ERROR:", error);

        setErrorMessage(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to fetch category."
        );
      }
    };

    fetchCategory();
  }, [id]);

  // INPUT CHANGE
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // BANNER CHANGE
  const handleBannerChange = (e) => {
    setFormData((previous) => ({
      ...previous,
      isHomeBanner: e.target.value === "true",
    }));
  };

  // IMAGE CHANGE
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

  // CHECK DUPLICATE CATEGORY, EXCLUDING CURRENT CATEGORY
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

    return categories.some((category) => {
      const categoryId = String(
        category._id || category.id || ""
      );

      const existingName = String(
        category.categoryName || ""
      )
        .trim()
        .toLowerCase();

      return (
        categoryId !== String(id) &&
        existingName === normalizedName
      );
    });
  };

  // UPDATE CATEGORY
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
      // CHECK DUPLICATE BEFORE UPDATE
      const isDuplicate = await checkDuplicateCategory(
        formData.categoryName
      );

      if (isDuplicate) {
        setErrorMessage(
          "Another category already uses this name. Please choose another name."
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

      data.append(
        "isHomeBanner",
        String(formData.isHomeBanner)
      );

      if (formData.image) {
        data.append("image", formData.image);
      }

      const response = await api.put(
        `/admin/category/edit/${id}`,
        data
      );

      console.log(
        "CATEGORY UPDATE RESPONSE:",
        response.data
      );

      setShowSuccess(true);
    } catch (error) {
      console.error("CATEGORY UPDATE ERROR:", error);

      setErrorMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update category."
      );
    } finally {
      setSaving(false);
    }
  };

  // CANCEL
 const handleCancel = () => {
  navigate("/admin/categories");
};

  return (
    <div className="add-category-page">
      {showSuccess && (
        <Success
          message="Category updated successfully!"
          onClose={() => {
            setShowSuccess(false);
            navigate("/admin/categories");
          }}
        />
      )}

      {/* HEADER */}
      <div className="add-category-header">
        <h2>Edit Category</h2>
      </div>

      {/* CARD */}
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

          {/* BANNER */}
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

          {/* IMAGE */}
          <div className="category-form-group">
            <label>Image</label>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
            />

            <small>
              Upload image (JPG, PNG, WEBP) — Max 2MB
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
              {saving ? "Updating..." : "Update"}
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

export default EditCategory;
