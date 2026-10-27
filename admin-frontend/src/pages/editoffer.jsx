import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../Api/axios";
import "./offerform.css";

const EditOffer = () => {
  const navigate = useNavigate();
  const { offerId } = useParams();

  const [formData, setFormData] = useState({
    offerName: "",
    offerType: "",
    productId: "",
    categoryId: "",
    discounttype: "",
    discountvalue: "",
    valid_from: "",
    valid_to: "",
    description: "",
    offer_status: "active",
  });

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // =========================
  // FETCH OFFER
  // =========================
  useEffect(() => {
    if (offerId) {
      fetchOffer();
    }
  }, [offerId]);

  const formatDate = (date) => {
    if (!date) return "";

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) {
      return "";
    }

    return d.toISOString().split("T")[0];
  };

  const fetchOffer = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("EDIT OFFER ID:", offerId);

      const response = await api.get(`/admin/offers/${offerId}`);

      console.log("EDIT OFFER RESPONSE:", response.data);

      const offer = response.data?.data;

      if (!offer) {
        setError("Offer not found");
        return;
      }

      /*
        If productId/categoryId are populated,
        take their _id.

        If they are just ObjectId strings,
        use them directly.
      */

      const productId =
        typeof offer.productId === "object" && offer.productId !== null
          ? offer.productId._id
          : offer.productId || "";

      const categoryId =
        typeof offer.categoryId === "object" && offer.categoryId !== null
          ? offer.categoryId._id
          : offer.categoryId || "";

      setFormData({
        offerName: offer.offerName || "",
        offerType: offer.offerType || "",
        productId: productId,
        categoryId: categoryId,
        discounttype: offer.discounttype || "",
        discountvalue:
          offer.discountvalue !== undefined &&
          offer.discountvalue !== null
            ? offer.discountvalue
            : "",
        valid_from: formatDate(offer.valid_from),
        valid_to: formatDate(offer.valid_to),
        description: offer.description || "",
        offer_status: offer.offer_status || "active",
      });

      // Load related products/categories
      if (offer.offerType === "product") {
        fetchProducts();
      }

      if (offer.offerType === "category") {
        fetchCategories();
      }
    } catch (error) {
      console.error("Get offer error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to load offer"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // FETCH PRODUCTS
  // =========================
  const fetchProducts = async () => {
    try {
      const response = await api.get("/admin/product");

      console.log("PRODUCT RESPONSE:", response.data);

      const productData =
        Array.isArray(response.data)
          ? response.data
          : response.data?.data ||
            response.data?.products ||
            [];

      setProducts(productData);
    } catch (error) {
      console.error("Get products error:", error);
    }
  };

  // =========================
  // FETCH CATEGORIES
  // =========================
  const fetchCategories = async () => {
    try {
      const response = await api.get("/admin/category");

      console.log("CATEGORY RESPONSE:", response.data);

      const categoryData =
        Array.isArray(response.data)
          ? response.data
          : response.data?.data ||
            response.data?.categories ||
            [];

      setCategories(categoryData);
    } catch (error) {
      console.error("Get categories error:", error);
    }
  };

  // =========================
  // HANDLE INPUT CHANGE
  // =========================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");

    // If offer type changes
    if (name === "offerType") {
      if (value === "product") {
        fetchProducts();

        setFormData((prev) => ({
          ...prev,
          offerType: value,
          productId: "",
          categoryId: "",
        }));
      }

      if (value === "category") {
        fetchCategories();

        setFormData((prev) => ({
          ...prev,
          offerType: value,
          productId: "",
          categoryId: "",
        }));
      }
    }
  };

  // =========================
  // HANDLE SUBMIT
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // Offer name
    if (!formData.offerName.trim()) {
      setError("Offer name is required");
      return;
    }

    // Offer type
    if (!formData.offerType) {
      setError("Offer type is required");
      return;
    }

    // Product validation
    if (
      formData.offerType === "product" &&
      !formData.productId
    ) {
      setError("Please select a product");
      return;
    }

    // Category validation
    if (
      formData.offerType === "category" &&
      !formData.categoryId
    ) {
      setError("Please select a category");
      return;
    }

    // Discount type
    if (!formData.discounttype) {
      setError("Discount type is required");
      return;
    }

    // Discount value
    if (
      formData.discountvalue === "" ||
      Number(formData.discountvalue) < 0
    ) {
      setError("Enter a valid discount value");
      return;
    }

    // Percentage validation
    if (
      formData.discounttype === "percentage" &&
      Number(formData.discountvalue) > 100
    ) {
      setError("Percentage discount cannot exceed 100");
      return;
    }

    // Dates
    if (!formData.valid_from || !formData.valid_to) {
      setError("Start date and end date are required");
      return;
    }

    if (
      new Date(formData.valid_from) >=
      new Date(formData.valid_to)
    ) {
      setError("Valid to date must be after valid from date");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        offerName: formData.offerName.trim(),

        offerType: formData.offerType,

        productId:
          formData.offerType === "product"
            ? formData.productId
            : null,

        categoryId:
          formData.offerType === "category"
            ? formData.categoryId
            : null,

        discounttype: formData.discounttype,

        discountvalue: Number(formData.discountvalue),

        valid_from: formData.valid_from,

        valid_to: formData.valid_to,

        description: formData.description.trim(),

        offer_status: formData.offer_status,
      };

      console.log("UPDATE OFFER PAYLOAD:", payload);

      const response = await api.put(
        `/admin/offers/${offerId}`,
        payload
      );

      console.log("UPDATE OFFER RESPONSE:", response.data);

      if (response.data?.success) {
        navigate("/admin/offer");
      } else {
        /*
          Some backends return the updated object
          without success:true.
        */
        navigate("/admin/offer");
      }
    } catch (error) {
      console.error("Update offer error:", error);

      setError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to update offer"
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <div className="offer-form-loading">
        Loading offer...
      </div>
    );
  }

  // =========================
  // JSX
  // =========================
  return (
    <div className="offer-form-page">
      <div className="offer-form-container">

        <form onSubmit={handleSubmit}>

          <div className="offer-form-grid">

            {/* =========================
                LEFT SIDE
            ========================= */}

            <div className="offer-form-left">

              {/* OFFER NAME */}
              <div className="offer-form-group">
                <label>
                  Offer Name <span>*</span>
                </label>

                <input
                  type="text"
                  name="offerName"
                  value={formData.offerName}
                  onChange={handleChange}
                  placeholder="Enter offer name"
                />
              </div>

              {/* OFFER TYPE */}
              <div className="offer-form-group">
                <label>
                  Offer Type <span>*</span>
                </label>

                <select
                  name="offerType"
                  value={formData.offerType}
                  onChange={handleChange}
                >
                  <option value="">
                    Enter offer type
                  </option>

                  <option value="product">
                    Product
                  </option>

                  <option value="category">
                    Category
                  </option>
                </select>
              </div>

              {/* PRODUCT */}
              {formData.offerType === "product" && (
                <div className="offer-form-group">
                  <label>
                    Product <span>*</span>
                  </label>

                  <select
                    name="productId"
                    value={formData.productId}
                    onChange={handleChange}
                  >
                    <option value="">
                      Select Product
                    </option>

                    {products.map((product) => (
                      <option
                        key={product._id}
                        value={product._id}
                      >
                        {product.productName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* CATEGORY */}
              {formData.offerType === "category" && (
                <div className="offer-form-group">
                  <label>
                    Category <span>*</span>
                  </label>

                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                  >
                    <option value="">
                      Select Category
                    </option>

                    {categories.map((category) => (
                      <option
                        key={category._id}
                        value={category._id}
                      >
                        {category.categoryName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* DISCOUNT TYPE */}
              <div className="offer-form-group">
                <label>
                  Discount Type <span>*</span>
                </label>

                <select
                  name="discounttype"
                  value={formData.discounttype}
                  onChange={handleChange}
                >
                  <option value="">
                    Enter discount type
                  </option>

                  <option value="percentage">
                    Percentage
                  </option>

                  <option value="fixed">
                    Fixed
                  </option>
                </select>
              </div>

              {/* DISCOUNT VALUE */}
              <div className="offer-form-group">
                <label>
                  Discount Value <span>*</span>
                </label>

                <div className="discount-input-wrapper">

                  <input
                    type="number"
                    name="discountvalue"
                    value={formData.discountvalue}
                    onChange={handleChange}
                    placeholder="Enter discount value"
                    min="0"
                  />

                  {formData.discounttype ===
                    "percentage" && (
                    <span>%</span>
                  )}

                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="offer-form-group description-group">
                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter offer description"
                  rows="3"
                />
              </div>

            </div>

            {/* =========================
                RIGHT SIDE
            ========================= */}

            <div className="offer-form-right">

              {/* VALID FROM */}
              <div className="offer-form-group">
                <label>
                  Valid From <span>*</span>
                </label>

                <input
                  type="date"
                  name="valid_from"
                  value={formData.valid_from}
                  onChange={handleChange}
                />
              </div>

              {/* VALID TO */}
              <div className="offer-form-group">
                <label>
                  Valid To <span>*</span>
                </label>

                <input
                  type="date"
                  name="valid_to"
                  value={formData.valid_to}
                  onChange={handleChange}
                />
              </div>

              {/* OFFER STATUS */}
              <div className="offer-form-group">
                <label>
                  Offer Status <span>*</span>
                </label>

                <select
                  name="offer_status"
                  value={formData.offer_status}
                  onChange={handleChange}
                >
                  <option value="active">
                    Active
                  </option>

                  <option value="inactive">
                    Inactive
                  </option>
                </select>
              </div>

            </div>

          </div>

          {/* ERROR */}
          {error && (
            <div className="offer-form-error">
              {error}
            </div>
          )}

          {/* BUTTONS */}
          <div className="offer-form-actions">

            <button
              type="button"
              className="offer-cancel-btn"
              onClick={() => navigate("/admin/offer")}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="offer-submit-btn"
              disabled={saving}
            >
              {saving
                ? "Updating..."
                : "Update Offer"}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
};

export default EditOffer;