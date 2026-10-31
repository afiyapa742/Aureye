import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import API from "../api/axios";
import "./SearchPage.css";

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const searchQuery = searchParams.get("query") || "";
  const category = searchParams.get("category") || "All";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // SEARCH PRODUCTS
  // ==========================================

  useEffect(() => {
    const fetchSearchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await API.get(
          "/product/search",
          {
            params: {
              search: searchQuery,
              category: category
            }
          }
        );

        console.log(
          "SEARCH PAGE RESULT:",
          response.data
        );

        setProducts(
          response.data.data || []
        );

      } catch (error) {
        console.error(
          "SEARCH PAGE ERROR:",
          error
        );

        setError(
          error?.response?.data?.message ||
          "Failed to search products"
        );

        setProducts([]);

      } finally {
        setLoading(false);
      }
    };

    if (searchQuery.trim()) {
      fetchSearchProducts();
    } else {
      setProducts([]);
      setLoading(false);
    }

  }, [searchQuery, category]);


  // ==========================================
  // GET PRODUCT IMAGE
  // ==========================================
const getProductImage = (product) => {
  const variantWithImage = product.variants?.find(
    (variant) =>
      variant.productImages?.some(
        (image) =>
          image?.imageUrl &&
          String(image.imageUrl).trim() !== ""
      )
  );

  const variant = variantWithImage || product.variants?.[0];

  const imageObject = variant?.productImages?.find(
    (image) =>
      image?.imageUrl &&
      String(image.imageUrl).trim() !== ""
  );

  const imageUrl = imageObject?.imageUrl;

  if (!imageUrl) return null;

  const API_ORIGIN = import.meta.env.VITE_API_BASE_URL.replace(
    /\/api\/?$/,
    ""
  );

  let imagePath = String(imageUrl).trim();

  if (!imagePath) return null;

  if (/^https?:\/\//i.test(imagePath)) {
    if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(imagePath)) {
      return imagePath;
    }

    imagePath = imagePath.replace(
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i,
      ""
    );
  }

  imagePath = imagePath.replace(/^\/+/, "");

  if (imagePath.startsWith("uploads/")) {
    return `${API_ORIGIN}/${imagePath}`;
  }

  return `${API_ORIGIN}/uploads/${imagePath}`;
};


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="search-page">
        <div className="search-loading">
          Searching...
        </div>
      </div>
    );
  }


  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="search-page">
        <div className="search-error">
          {error}
        </div>
      </div>
    );
  }


  return (
    <div className="search-page">

      {/* ======================================
          SEARCH TITLE
      ====================================== */}

      <div className="search-heading">

        <h2>
          Search Results
        </h2>

        <p>
          Results for "{searchQuery}"
        </p>

      </div>


      {/* ======================================
          PRODUCTS
      ====================================== */}

      {products.length === 0 ? (

        <div className="no-search-products">
          No products found
        </div>

      ) : (

        <div className="search-product-grid">

          {products.map((product) => {

            const image =
              getProductImage(product);

            const variant =
              product.variants?.[0];

            return (

              <div
                className="search-product-card"
                key={product._id}
                onClick={() =>
                  navigate(
                    `/product/${product._id}`
                  )
                }
              >

                {/* PRODUCT IMAGE */}

                <div className="search-product-image">

                  {image && (
                    <img
                      src={image}
                      alt={
                        product.productName
                      }
                    />
                  )}

                </div>


                {/* PRODUCT NAME */}

                <h3>
                  {product.productName}
                </h3>


                {/* PRODUCT PRICE */}

                {variant && (
                  <p className="search-product-price">
                    ₹{variant.price}
                  </p>
                )}

              </div>

            );

          })}

        </div>

      )}

    </div>
  );
};

export default SearchPage;