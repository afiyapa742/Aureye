import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../Api/axios";
import "./offerform.css";

const AddOffer = () => {
  const navigate = useNavigate();

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

  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ==========================================
     GET PRODUCTS
  ========================================== */

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      setError("");

      const response = await api.get("/product");

      console.log("PRODUCT RESPONSE:", response.data);

      let productData = [];

      if (Array.isArray(response.data)) {
        productData = response.data;
      } else if (Array.isArray(response.data?.data)) {
        productData = response.data.data;
      } else if (Array.isArray(response.data?.products)) {
        productData = response.data.products;
      }

      setProducts(productData);
    } catch (error) {
      console.error("GET PRODUCTS ERROR:", error);

      setError(
        error.response?.data?.message ||
          "Failed to load products"
      );
    } finally {
      setLoadingProducts(false);
    }
  };

  /* ==========================================
     GET CATEGORIES
  ========================================== */

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      setError("");

      const response = await api.get("/admin/category");

      console.log("CATEGORY RESPONSE:", response.data);

      let categoryData = [];

      if (Array.isArray(response.data)) {
        categoryData = response.data;
      } else if (Array.isArray(response.data?.data)) {
        categoryData = response.data.data;
      } else if (Array.isArray(response.data?.categories)) {
        categoryData = response.data.categories;
      }

      setCategories(categoryData);
    } catch (error) {
      console.error("GET CATEGORIES ERROR:", error);

      setError(
        error.response?.data?.message ||
          "Failed to load categories"
      );
    } finally {
      setLoadingCategories(false);
    }
  };

  /* ==========================================
     CHANGE INPUT
  ========================================== */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  /* ==========================================
     OFFER TYPE CHANGE
  ========================================== */

  const handleOfferTypeChange = (e) => {
    const value = e.target.value;

    setFormData((prev) => ({
      ...prev,
      offerType: value,
      productId: "",
      categoryId: "",
    }));

    setError("");

    if (value === "product") {
      fetchProducts();
    }

    if (value === "category") {
      fetchCategories();
    }
  };

  /* ==========================================
     CREATE OFFER
  ========================================== */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    /* OFFER NAME */

    if (!formData.offerName.trim()) {
      setError("Offer name is required");
      return;
    }

    /* OFFER TYPE */

    if (!formData.offerType) {
      setError("Offer type is required");
      return;
    }

    /* PRODUCT OFFER */

    if (
      formData.offerType === "product" &&
      !formData.productId
    ) {
      setError("Please select a product");
      return;
    }

    /* CATEGORY OFFER */

    if (
      formData.offerType === "category" &&
      !formData.categoryId
    ) {
      setError("Please select a category");
      return;
    }

    /* DISCOUNT TYPE */

    if (!formData.discounttype) {
      setError("Discount type is required");
      return;
    }

    /* DISCOUNT VALUE */

    if (
      formData.discountvalue === "" ||
      Number(formData.discountvalue) < 0
    ) {
      setError("Enter a valid discount value");
      return;
    }

    /* VALIDITY DATES */

    if (
      !formData.valid_from ||
      !formData.valid_to
    ) {
      setError("Start date and end date are required");
      return;
    }

    if (
      new Date(formData.valid_from) >=
      new Date(formData.valid_to)
    ) {
      setError(
        "Valid to date must be after valid from date"
      );
      return;
    }

    /* PERCENTAGE */

    if (
      formData.discounttype === "percentage" &&
      Number(formData.discountvalue) > 100
    ) {
      setError(
        "Percentage discount cannot exceed 100"
      );
      return;
    }

    try {
      setLoading(true);

      const data = {
        offerName: formData.offerName.trim(),

        offerType: formData.offerType,

        /*
          COMMON
          productId = null
          categoryId = null

          PRODUCT
          productId = selected product _id
          categoryId = null

          CATEGORY
          productId = null
          categoryId = selected category _id
        */

        productId:
          formData.offerType === "product"
            ? formData.productId
            : null,

        categoryId:
          formData.offerType === "category"
            ? formData.categoryId
            : null,

        discounttype: formData.discounttype,

        discountvalue: Number(
          formData.discountvalue
        ),

        valid_from: formData.valid_from,

        valid_to: formData.valid_to,

        description:
          formData.description.trim(),

        offer_status:
          formData.offer_status,
      };

      console.log("CREATE OFFER DATA:", data);

      const response = await api.post(
        "/admin/offers",
        data
      );

      console.log(
        "CREATE OFFER RESPONSE:",
        response.data
      );

      if (response.data?.success) {
        navigate("/admin/offer");
      } else {
        setError(
          response.data?.message ||
            "Failed to create offer"
        );
      }
    } catch (error) {
      console.error(
        "CREATE OFFER ERROR:",
        error
      );

      console.error(
        "CREATE OFFER ERROR RESPONSE:",
        error.response?.data
      );

      setError(
        error.response?.data?.message ||
          "Failed to create offer"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="offer-form-page">

      <div className="offer-form-container">

        <form onSubmit={handleSubmit}>

          <div className="offer-form-grid">

            {/* =================================
                LEFT
            ================================= */}

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
                  onChange={handleOfferTypeChange}
                >

                  <option value="">
                    Enter offer type
                  </option>

                  <option value="common">
                    Common
                  </option>

                  <option value="product">
                    Product
                  </option>

                  <option value="category">
                    Category
                  </option>

                </select>

              </div>


              {/* PRODUCT NAME */}

              {formData.offerType === "product" && (

                <div className="offer-form-group">

                  <label>
                    Product Name <span>*</span>
                  </label>

                  <select
                    name="productId"
                    value={formData.productId}
                    onChange={handleChange}
                  >

                    <option value="">
                      {loadingProducts
                        ? "Loading products..."
                        : "Select product"}
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


              {/* CATEGORY NAME */}

              {formData.offerType === "category" && (

                <div className="offer-form-group">

                  <label>
                    Category Name <span>*</span>
                  </label>

                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                  >

                    <option value="">
                      {loadingCategories
                        ? "Loading categories..."
                        : "Select category"}
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
                  Discount Value
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


            {/* =================================
                RIGHT
            ================================= */}

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


              {/* STATUS */}

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
              onClick={() =>
                navigate("/admin/offer")
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              className="offer-submit-btn"
              disabled={loading}
            >
              {loading
                ? "Creating..."
                : "Create Offer"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

export default AddOffer;