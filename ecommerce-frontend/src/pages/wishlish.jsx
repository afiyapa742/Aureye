import React, { useEffect, useState } from "react";
import API from "../api/axios";
import "./Wishlist.css";
import SuccessPopup from "../components/successpop";
const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  /* ==========================================
     IMAGE URL
  ========================================== */

  const getImageUrl = (image) => {
    if (!image) {
      return "";
    }

    if (String(image).startsWith("http")) {
      return image;
    }

    if (String(image).startsWith("/uploads/")) {
      return `http://localhost:5000${image}`;
    }

    return `http://localhost:5000/uploads/${image}`;
  };

  /* ==========================================
     GET PRODUCT NAME
  ========================================== */

  const getProductName = (item) => {
    return (
      item.variantId?.productId?.productName ||
      item.variantId?.productName ||
      "Product"
    );
  };

  /* ==========================================
     GET PRICE
  ========================================== */

  const getPrice = (item) => {
    return Number(item.variantId?.price || 0);
  };

  /* ==========================================
     GET IMAGE
  ========================================== */

  const getProductImage = (item) => {
    const images = item.variantId?.productImages || [];

    if (!Array.isArray(images) || images.length === 0) {
      return "";
    }

    const firstImage = images[0];

    // If image is an object
    if (typeof firstImage === "object") {
      return getImageUrl(
        firstImage.imageUrl ||
          firstImage.url ||
          firstImage.filename ||
          firstImage.path
      );
    }

    // If image is directly a string
    return getImageUrl(firstImage);
  };

  /* ==========================================
     GET PRODUCT ID
  ========================================== */

  const getProductId = (item) => {
    return item.variantId?.productId?._id;
  };

  /* ==========================================
     GET VARIANT ID
  ========================================== */

  const getVariantId = (item) => {
    return item.variantId?._id;
  };

  /* ==========================================
     GET WISHLIST
  ========================================== */

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/wishlist");

      console.log("WISHLIST RESPONSE:", response.data);

      const wishlist =
        response.data?.data ||
        response.data?.wishlist ||
        response.data ||
        [];

      if (Array.isArray(wishlist)) {
        setWishlistItems(wishlist);
      } else if (Array.isArray(wishlist?.wishlistItems)) {
        setWishlistItems(wishlist.wishlistItems);
      } else if (Array.isArray(wishlist?.items)) {
        setWishlistItems(wishlist.items);
      } else {
        setWishlistItems([]);
      }
    } catch (error) {
      console.error("GET WISHLIST ERROR:", error);

      setError(
        error.response?.data?.message ||
          "Unable to load wishlist"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  /* ==========================================
     REMOVE FROM WISHLIST
  ========================================== */

  const removeFromWishlist = async (item) => {
    try {
      const variantId = getVariantId(item);

      await API.delete(`/wishlist/${variantId}`);

      setWishlistItems((prev) =>
        prev.filter(
          (wishlistItem) =>
            getVariantId(wishlistItem) !== variantId
        )
      );
    } catch (error) {
      console.error(
        "REMOVE WISHLIST ERROR:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Unable to remove from wishlist"
      );
    }
  };

  /* ==========================================
     ADD TO CART
     THEN REMOVE FROM WISHLIST
  ========================================== */

  const addToCart = async (item) => {
    try {
      const variantId = getVariantId(item);

      if (!variantId) {
        alert("No product variant available");
        return;
      }

      await API.post("/cart", {
        variantId,
        quantity: 1
      });

      // Remove from wishlist after
      // successfully adding to cart
      await removeFromWishlist(item);

      // Show success popup
      setShowSuccessPopup(true);

    } catch (error) {
      console.error(
        "ADD TO CART ERROR:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Unable to add product to cart"
      );
    }
  };

  /* ==========================================
     MOVE ALL TO BAG
  ========================================== */

  const moveAllToBag = async () => {
    if (wishlistItems.length === 0) {
      return;
    }

    try {
      for (const item of wishlistItems) {
        const variantId = getVariantId(item);

        if (!variantId) {
          continue;
        }

        await API.post("/cart", {
          variantId,
          quantity: 1
        });

        const variantIdForRemove =
          getVariantId(item);

        await API.delete(
          `/wishlist/${variantIdForRemove}`
        );
      }

      setWishlistItems([]);

      alert("All products moved to cart");

    } catch (error) {
      console.error(
        "MOVE ALL TO BAG ERROR:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Unable to move products to cart"
      );

      fetchWishlist();
    }
  };

  /* ==========================================
     EMPTY WISHLIST
  ========================================== */

  const emptyWishlist = async () => {
    if (wishlistItems.length === 0) {
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to empty your wishlist?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      for (const item of wishlistItems) {
        const variantId = getVariantId(item);

        await API.delete(
          `/wishlist/${variantId}`
        );
      }

      setWishlistItems([]);

    } catch (error) {
      console.error(
        "EMPTY WISHLIST ERROR:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Unable to empty wishlist"
      );

      fetchWishlist();
    }
  };

  /* ==========================================
     LOADING
  ========================================== */

  if (loading) {
    return (
      <div className="wishlist-loading">
        Loading wishlist...
      </div>
    );
  }

  /* ==========================================
     ERROR
  ========================================== */

  if (error) {
    return (
      <div className="wishlist-error">
        {error}
      </div>
    );
  }

  return (
    <div className="wishlist-page">

      {/* ======================================
          WISHLIST HEADER
      ====================================== */}

      <div className="wishlist-header">

        <span>
          Wishlist ({wishlistItems.length})
        </span>

        <div className="wishlist-header-buttons">

          <button
            className="move-all-button"
            onClick={moveAllToBag}
          >
            Move All To Bag
          </button>

          <button
            className="empty-wishlist-button"
            onClick={emptyWishlist}
          >
            Empty my Wishlist
          </button>

        </div>

      </div>

      {/* ======================================
          EMPTY WISHLIST
      ====================================== */}

      {wishlistItems.length === 0 ? (

        <div className="wishlist-empty">

          <h2>Your Wishlist is Empty</h2>

          <p>
            Add products you love to your wishlist.
          </p>

        </div>

      ) : (

        /* ====================================
           WISHLIST PRODUCTS
        ==================================== */

        <div className="wishlist-scroll">

          <div className="wishlist-grid">

            {wishlistItems.map((item, index) => {

              const productId =
                getProductId(item);

              return (
                <div
                  className="wishlist-card"
                  key={
                    productId || index
                  }
                >

                  {/* PRODUCT IMAGE */}

                  <div className="wishlist-image">

                    {getProductImage(item) ? (

                      <img
                        src={getProductImage(item)}
                        alt={getProductName(item)}
                      />

                    ) : (

                      <div className="wishlist-no-image">
                        No Image
                      </div>

                    )}

                  </div>

                  {/* PRODUCT NAME */}

                  <div className="wishlist-product-name">
                    {getProductName(item)}
                  </div>

                  {/* PRODUCT PRICE */}

                  <div className="wishlist-price">
                    ₹ {getPrice(item)}
                  </div>

                  {/* ADD TO CART */}

                  <button
                    className="wishlist-cart-button"
                    onClick={() =>
                      addToCart(item)
                    }
                  >
                    Add To Cart
                  </button>

                  {/* REMOVE */}

                  <button
                    className="wishlist-remove-button"
                    onClick={() =>
                      removeFromWishlist(item)
                    }
                  >
                    Remove from Wishlist
                  </button>

                </div>
              );
            })}

          </div>

        </div>

      )}

      {/* ======================================
          SUCCESS POPUP
      ====================================== */}

      {showSuccessPopup && (
        <SuccessPopup
          message="Product has been added to your cart successfully."
          onClose={() =>
            setShowSuccessPopup(false)
          }
        />
      )}

    </div>
  );
};

export default Wishlist;