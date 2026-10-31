import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Heart,
  ShoppingCart,
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
  Star,
  Truck
} from "lucide-react";
import ErrorPage from "../components/errorpage";
import API from "../api/axios";
import "./ProductDetails.css";
import AddressPopup from "../components/adresspopup";

const ProductDetails = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const dragStartX = useRef(null);
  const suppressImageClick = useRef(false);
  const similarRef = useRef(null);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [localReviews, setLocalReviews] = useState([]);
  const [reviewZoomOpen, setReviewZoomOpen] = useState(false);
  const [selectedReviewImage, setSelectedReviewImage] = useState("");
  const [showAddressPopup, setShowAddressPopup] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [productOffer, setProductOffer] = useState(null);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupNavigateBack, setPopupNavigateBack] = useState(false);

  const showPopup = (message, navigateBack = false) => {
    setPopupMessage(message);
    setPopupNavigateBack(navigateBack);
  };

  const scrollSimilar = (direction) => {
    const container = similarRef.current;

    if (!container) return;

    container.scrollBy({
      left: direction * (container.clientWidth * 0.8),
      behavior: "smooth"
    });
  };

  const closePopup = () => {
    setPopupMessage("");
    if (popupNavigateBack) {
      setPopupNavigateBack(false);
      navigate(-1);
    }
  };

  // ==========================================
  // LOAD LOCAL REVIEWS
  // ==========================================

  useEffect(() => {
    try {
      const savedReviews = JSON.parse(
        localStorage.getItem("productReviews") || "[]"
      );

      const productReviews = Array.isArray(savedReviews)
        ? savedReviews.filter(
            (review) =>
              String(review?.productId || "") ===
              String(productId || "")
          )
        : [];

      setLocalReviews(productReviews);
    } catch (reviewError) {
      console.error("PRODUCT REVIEWS READ ERROR:", reviewError);
      setLocalReviews([]);
    }
  }, [productId]);

  // Open the Review tab after returning from review submission.

  useEffect(() => {
    if (location.state?.activeTab === "review") {
      setActiveTab("review");
    }
  }, [location.state]);

  // ==========================================
  // IMAGE URL
  // Same image structure used in CategoryPage
  // ==========================================

  const getImageUrl = (imageUrl) => {
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
  // FETCH PRODUCT DETAILS
  // ==========================================

  useEffect(() => {
    let cancelled = false;

    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        setError("");

        // Clear everything that belongs to the previous product
        // so old product data / old offer never shows.

        setProduct(null);
        setProductOffer(null);
        setSimilarProducts([]);
        setSelectedColor("");
        setSelectedSize("");
        setSelectedImage(0);
        setQuantity(1);

        window.scrollTo(0, 0);

        const response = await API.get(`/product/details/${productId}`);

        if (cancelled) return;

        console.log("PRODUCT DETAILS RESPONSE:", response.data);

        const productData =
          response.data?.product ||
          response.data?.data ||
          response.data;

        if (!productData) {
          throw new Error("Product not found");
        }

        // Redirect if product is blocked/unavailable.

        if (
          productData.status &&
          String(productData.status).toLowerCase() !== "active"
        ) {
          showPopup("This product is no longer available.", true);
          return;
        }

        setProduct(productData);

        // ======================================
        // GET VARIANTS
        // ======================================

        const variants = productData.variants || [];

        // First available color

        const firstColor = variants.find(
          (variant) =>
            variant.color !== undefined &&
            variant.color !== null &&
            String(variant.color).trim() !== ""
        );

        if (firstColor) {
          setSelectedColor(String(firstColor.color).trim());
        }

        // First available size

        const firstSize = variants.find(
          (variant) =>
            variant.size !== undefined &&
            variant.size !== null &&
            String(variant.size).trim() !== ""
        );

        if (firstSize) {
          setSelectedSize(String(firstSize.size).trim());
        }

        // ======================================
        // SIMILAR PRODUCTS
        // ======================================

        try {
          const productResponse = await API.get("/product");

          const rawProducts =
            productResponse.data?.data ??
            productResponse.data?.products ??
            productResponse.data ??
            [];

          // Accept an array directly, or an array nested inside the response.
          const allProducts = Array.isArray(rawProducts)
            ? rawProducts
            : Array.isArray(rawProducts?.products)
            ? rawProducts.products
            : Array.isArray(rawProducts?.data)
            ? rawProducts.data
            : [];

          console.log("SIMILAR: total products from /product:", allProducts.length);

          {
            // Category can arrive as an id, a populated object, or a name,
            // and the details response may not include it, so collect every
            // form we can find for both the current product and each item.

            const getCategoryKeys = (obj) => {
              if (!obj) return [];

              const category = obj.category;

              return [
                category?._id,
                typeof category === "string" ? category : null,
                obj.categoryId?._id,
                typeof obj.categoryId === "string" ? obj.categoryId : null,
                category?.categoryName,
                category?.name,
                obj.categoryName
              ]
                .filter(
                  (value) =>
                    value !== undefined &&
                    value !== null &&
                    String(value).trim() !== ""
                )
                .map((value) => String(value).trim().toLowerCase());
            };

            const isActiveItem = (item) =>
              !item.status ||
              String(item.status).toLowerCase() === "active";

            // The details response may not include the category,
            // so also read it from this product's entry in the list.

            const currentListItem = allProducts.find(
              (item) => String(item._id) === String(productData._id)
            );

            const currentKeys = [
              ...getCategoryKeys(productData),
              ...getCategoryKeys(currentListItem)
            ];

            const otherProducts = allProducts.filter(
              (item) =>
                String(item._id) !== String(productData._id) &&
                isActiveItem(item)
            );

            const sameCategoryProducts = otherProducts.filter((item) =>
              getCategoryKeys(item).some((key) =>
                currentKeys.includes(key)
              )
            );

            console.log(
              "SIMILAR: current category keys:",
              currentKeys,
              "| same category:",
              sameCategoryProducts.length,
              "| other active:",
              otherProducts.length
            );

            // Only products from the SAME category are similar.
            const relatedProducts = sameCategoryProducts.slice(0, 4);

            // The normal product list does not include variants/images.
            // Fetch product details for each similar product so its
            // variant image can be displayed like the main product.

            const productsWithDetails = await Promise.all(
              relatedProducts.map(async (item) => {
                try {
                  const detailResponse = await API.get(
                    `/product/details/${item._id}`
                  );

                  return (
                    detailResponse.data?.product ||
                    detailResponse.data?.data ||
                    item
                  );
                } catch (detailError) {
                  console.error(
                    "SIMILAR PRODUCT DETAIL ERROR:",
                    detailError
                  );

                  return item;
                }
              })
            );

            if (!cancelled) {
              setSimilarProducts(productsWithDetails);
            }
          }
        } catch (similarError) {
          console.error("SIMILAR PRODUCTS ERROR:", similarError);

          if (!cancelled) {
            setSimilarProducts([]);
          }
        }
      } catch (error) {
        if (cancelled) return;

        console.error("PRODUCT DETAILS ERROR:", error);

        setError(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to load product details"
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (productId) {
      fetchProductDetails();
    }

    return () => {
      cancelled = true;
    };
  }, [productId]);

  // ==========================================
  // FETCH PRODUCT OFFER
  // Runs only when the loaded product matches
  // the product in the URL, so the previous
  // product's offer is never used.
  // ==========================================

  useEffect(() => {
    let cancelled = false;

    const fetchProductOffer = async () => {
      try {
        const loadedProductId = product?._id || product?.id;

        if (
          !productId ||
          !product ||
          (loadedProductId &&
            String(loadedProductId) !== String(productId))
        ) {
          setProductOffer(null);
          return;
        }

        const response = await API.get("/offers");

        // Ignore a late response that belongs to an older product.
        if (cancelled) return;

        const offers =
          response.data?.data ||
          response.data?.offers ||
          [];

        const now = new Date();

        // Get the category id from the product details.

        const productCategoryId =
          product?.category?._id ||
          product?.categoryId ||
          product?.category;

        // Only offers that are active and currently valid
        // should affect the product price.

        const validOffers = Array.isArray(offers)
          ? offers.filter((offer) => {
              if (
                String(offer?.offer_status || "").toLowerCase() !==
                "active"
              ) {
                return false;
              }

              if (offer?.valid_from) {
                const validFrom = new Date(offer.valid_from);

                if (validFrom > now) {
                  return false;
                }
              }

              if (offer?.valid_to) {
                const validTo = new Date(offer.valid_to);

                if (validTo < now) {
                  return false;
                }
              }

              return true;
            })
          : [];

        // 1. Product offer - highest priority

        const productSpecificOffer = validOffers.find((offer) => {
          if (
            String(offer?.offerType || "").toLowerCase() !== "product"
          ) {
            return false;
          }

          const offerProductId =
            offer?.productId?._id || offer?.productId;

          return String(offerProductId) === String(productId);
        });

        // 2. Category offer - applies to all products in this category

        const categoryOffer = validOffers.find((offer) => {
          if (
            String(offer?.offerType || "").toLowerCase() !== "category"
          ) {
            return false;
          }

          const offerCategoryId =
            offer?.categoryId?._id || offer?.categoryId;

          return (
            productCategoryId &&
            String(offerCategoryId) === String(productCategoryId)
          );
        });

        // 3. Common offer - applies to all products

        const commonOffer = validOffers.find((offer) => {
          return (
            String(offer?.offerType || "").toLowerCase() === "common"
          );
        });

        // Priority: Product > Category > Common

        const matchedOffer =
          productSpecificOffer ||
          categoryOffer ||
          commonOffer ||
          null;

        setProductOffer(matchedOffer);

        console.log("PRODUCT OFFER:", matchedOffer);
      } catch (error) {
        if (cancelled) return;

        console.error("PRODUCT OFFER ERROR:", error);

        setProductOffer(null);
      }
    };

    fetchProductOffer();

    return () => {
      cancelled = true;
    };
  }, [productId, product]);

  // ==========================================
  // VARIANTS
  // ==========================================

  const variants = useMemo(() => {
    return product?.variants || [];
  }, [product]);

  // ==========================================
  // COLORS
  // ==========================================

  const colors = useMemo(() => {
    const result = [];

    variants.forEach((variant) => {
      if (variant.color !== undefined && variant.color !== null) {
        const color = String(variant.color).trim();

        if (
          color &&
          !result.some(
            (item) => item.toLowerCase() === color.toLowerCase()
          )
        ) {
          result.push(color);
        }
      }
    });

    return result;
  }, [variants]);

  // ==========================================
  // SIZES
  // ==========================================

  const sizes = useMemo(() => {
    // Standard shoe sizes shown in the product UI.
    // Sizes that do not exist for the selected color are disabled.

    const standardSizes = [
      "7",
      "7.5",
      "8",
      "8.5",
      "9",
      "9.5",
      "10",
      "10.5",
      "11",
      "11.5",
      "12",
      "12.5",
      "13",
      "13.5",
      "14"
    ];

    const variantSizes = variants
      .map((variant) =>
        variant.size !== undefined && variant.size !== null
          ? String(variant.size).trim()
          : ""
      )
      .filter(Boolean);

    return [
      ...standardSizes,
      ...variantSizes.filter((size) => !standardSizes.includes(size))
    ];
  }, [variants]);

  const availableSizes = useMemo(() => {
    const selectedColorValue = String(selectedColor || "")
      .trim()
      .toLowerCase();

    return variants
      .filter((variant) => {
        const variantColor = String(variant.color || "")
          .trim()
          .toLowerCase();

        return (
          !selectedColorValue || variantColor === selectedColorValue
        );
      })
      .map((variant) =>
        variant.size !== undefined && variant.size !== null
          ? String(variant.size).trim()
          : ""
      )
      .filter(Boolean);
  }, [variants, selectedColor]);

  const isSizeAvailable = (size) => {
    return availableSizes.some(
      (availableSize) =>
        String(availableSize).trim() === String(size).trim()
    );
  };

  // ==========================================
  // SELECTED VARIANT
  // ==========================================

  const selectedVariant = useMemo(() => {
    if (!variants.length) {
      return null;
    }

    // Exact color + size match

    const exactVariant = variants.find((variant) => {
      const variantColor =
        variant.color !== undefined && variant.color !== null
          ? String(variant.color).trim()
          : "";

      const variantSize =
        variant.size !== undefined && variant.size !== null
          ? String(variant.size).trim()
          : "";

      return (
        variantColor.toLowerCase() === selectedColor.toLowerCase() &&
        variantSize === selectedSize
      );
    });

    if (exactVariant) {
      return exactVariant;
    }

    // Color match

    const colorVariant = variants.find((variant) => {
      const variantColor =
        variant.color !== undefined && variant.color !== null
          ? String(variant.color).trim()
          : "";

      return variantColor.toLowerCase() === selectedColor.toLowerCase();
    });

    if (colorVariant) {
      return colorVariant;
    }

    // First variant

    return variants[0];
  }, [variants, selectedColor, selectedSize]);

  // ==========================================
  // IMAGES FROM SELECTED VARIANT
  // ==========================================

  const productImages = useMemo(() => {
    const variant = selectedVariant || variants[0];

    const images = variant?.productImages || [];

    const validImages = images
      .map((image) => getImageUrl(image?.imageUrl))
      .filter(Boolean);

    return validImages;
  }, [selectedVariant, variants]);

  // Reset selected image when variant changes

  useEffect(() => {
    setSelectedImage(0);
  }, [selectedVariant]);

  // Close image zoom with Escape.

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setZoomOpen(false);
      }
    };

    if (zoomOpen) {
      document.addEventListener("keydown", handleEscape);

      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);

      document.body.style.overflow = "";
    };
  }, [zoomOpen]);

  // ==========================================
  // PRICE + ADMIN PRODUCT OFFER
  // ==========================================

  const basePrice = Number(selectedVariant?.price ?? 0);

  const productDiscount = Number(
    selectedVariant?.discount ?? product?.discount ?? 0
  );

  const productOriginalPrice =
    productDiscount > 0
      ? Math.round(basePrice / (1 - productDiscount / 100))
      : basePrice;

  const offerDiscountType = String(
    productOffer?.discounttype || ""
  ).toLowerCase();

  const offerDiscountValue = Number(productOffer?.discountvalue ?? 0);

  let finalPrice = basePrice;

  if (productOffer && offerDiscountValue > 0) {
    if (
      offerDiscountType === "percentage" ||
      offerDiscountType === "percent"
    ) {
      finalPrice = Math.max(
        0,
        Math.round(basePrice - (basePrice * offerDiscountValue) / 100)
      );
    } else if (
      offerDiscountType === "fixed" ||
      offerDiscountType === "amount"
    ) {
      finalPrice = Math.max(
        0,
        Math.round(basePrice - offerDiscountValue)
      );
    }
  }

  const isPercentOffer =
    offerDiscountType === "percentage" ||
    offerDiscountType === "percent";

  const offerSavings = productOffer
    ? Math.max(0, basePrice - finalPrice)
    : 0;

  // ==========================================
  // DESCRIPTION
  // ==========================================

  const description =
    selectedVariant?.longDescription ||
    selectedVariant?.shortDescription ||
    product?.description ||
    "No product description available.";

  // ==========================================
  // QUANTITY
  // ==========================================

  const stock = Number(selectedVariant?.stock ?? 0);

  const increaseQuantity = () => {
    if (quantity < stock) {
      setQuantity((previous) => previous + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity((previous) => previous - 1);
    }
  };

  // ==========================================
  // COLOR CHANGE
  // ==========================================

  const handleColorChange = (color) => {
    setSelectedColor(color);

    const firstVariantForColor = variants.find(
      (variant) =>
        String(variant.color || "")
          .trim()
          .toLowerCase() === String(color).trim().toLowerCase()
    );

    if (firstVariantForColor?.size) {
      setSelectedSize(String(firstVariantForColor.size).trim());
    }

    setSelectedImage(0);
  };

  // ==========================================
  // SIZE CHANGE
  // ==========================================

  const handleSizeChange = (size) => {
    if (!isSizeAvailable(size)) {
      return;
    }

    setSelectedSize(String(size).trim());

    setSelectedImage(0);
  };

  // ==========================================
  // ADD TO CART
  // ==========================================

  const handleAddToCart = async () => {
    if (!selectedVariant?._id) {
      showPopup("Please select a valid variant");
      return;
    }

    if (stock < 1) {
      showPopup("Product is currently unavailable");
      return;
    }

    try {
      const payload = {
        productId: product._id,
        variantId: selectedVariant._id,
        quantity,
        price: finalPrice,
      };

      console.log("ADD TO CART PAYLOAD:", payload);

      const response = await API.post("/cart", payload);

      console.log("ADD TO CART RESPONSE:", response.data);

      navigate("/cart");
    } catch (error) {
      console.error("ADD TO CART ERROR:", error);

      showPopup(
        error?.response?.data?.message ||
          "Failed to add product to cart"
      );
    }
  };

  // ==========================================
  // WISHLIST
  // ==========================================

  const handleWishlist = async () => {
    if (!selectedVariant?._id) {
      showPopup("Please select a valid variant");
      return;
    }

    try {
      const payload = {
        variantId: selectedVariant._id
      };

      console.log("WISHLIST PAYLOAD:", payload);

      const response = await API.post("/wishlist", payload);

      console.log("WISHLIST RESPONSE:", response.data);

      showPopup(
        response?.data?.message || "Product added to wishlist"
      );
    } catch (error) {
      console.error("WISHLIST ERROR:", error);

      showPopup(
        error?.response?.data?.message ||
          "Failed to add product to wishlist"
      );
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="product-details-loading">Loading...</div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error || !product) {
    return (
      <div className="product-details-error">
        <ErrorPage
          message={
            error ||
            "Please check your internet connection and try again."
          }
        />

        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  // ==========================================
  // PRODUCT NAME
  // ==========================================

  const productName =
    product.productName || product.name || "Product";

  const categoryName =
    product.category?.categoryName ||
    product.category?.name ||
    product.categoryName ||
    "Category";

  const manufacturer =
    product.manufacture ||
    product.manufacturer ||
    "Manufacturer information is not available.";

  const allReviews = [
    ...localReviews,
    ...(Array.isArray(product.reviews) ? product.reviews : []),
  ];

  const ratedReviews = allReviews
    .map((review) => Number(review?.rating))
    .filter(
      (reviewRating) =>
        Number.isFinite(reviewRating) &&
        reviewRating >= 1 &&
        reviewRating <= 5
    );

  const productRating =
    ratedReviews.length > 0
      ? ratedReviews.reduce(
          (total, reviewRating) => total + reviewRating,
          0
        ) / ratedReviews.length
      : Number(product.rating || 0);

  const rating = Number(productRating.toFixed(1));

  const backendReviewCount = Number(
    product.reviewCount || product.reviews?.length || 0
  );

  const reviewCount = backendReviewCount + localReviews.length;

  return (
    <div className="product-details-page">

      {/* ==========================================
          MAIN PRODUCT
      ========================================== */}

      <section className="product-main-section">

        {/* ========================================
            LEFT - GALLERY
        ======================================== */}

        <div className="product-gallery">

          <div
            className="main-product-image"
            style={{ touchAction: "pan-y", cursor: productImages.length > 1 ? "grab" : "default" }}
            onPointerDown={(event) => {
              dragStartX.current = event.clientX;
              suppressImageClick.current = false;
            }}
            onPointerUp={(event) => {
              if (dragStartX.current === null || productImages.length < 2) return;

              const difference = event.clientX - dragStartX.current;
              dragStartX.current = null;

              if (Math.abs(difference) > 35) {
                suppressImageClick.current = true;
                setSelectedImage((previous) =>
                  difference < 0
                    ? (previous + 1) % productImages.length
                    : (previous - 1 + productImages.length) % productImages.length
                );
              }
            }}
            onPointerCancel={() => {
              dragStartX.current = null;
            }}
          >

            {productImages.length > 1 && (
              <button
                className="image-arrow left"
                onClick={() =>
                  setSelectedImage((previous) =>
                    previous === 0
                      ? productImages.length - 1
                      : previous - 1
                  )
                }
              >
                <ChevronLeft size={18} />
              </button>
            )}

            {productImages.length > 0 ? (
              <img
                className="zoomable-product-image"
                src={productImages[selectedImage]}
                alt={productName}
                onClick={() => {
                  if (suppressImageClick.current) {
                    suppressImageClick.current = false;
                    return;
                  }
                  setZoomOpen(true);
                }}
                onError={(event) => {
                  console.error(
                    "PRODUCT DETAIL IMAGE FAILED:",
                    event.currentTarget.src
                  );

                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="no-product-image">
                No image available
              </div>
            )}

            {productImages.length > 1 && (
              <button
                className="image-arrow right"
                onClick={() =>
                  setSelectedImage((previous) =>
                    previous === productImages.length - 1
                      ? 0
                      : previous + 1
                  )
                }
              >
                <ChevronRight size={18} />
              </button>
            )}

          </div>

          {/* THUMBNAILS */}

          {productImages.length > 0 && (
            <div className="product-thumbnails">

              {productImages.map((image, index) => (
                <button
                  key={index}
                  className={`thumbnail ${
                    selectedImage === index ? "active" : ""
                  }`}
                  onClick={() => setSelectedImage(index)}
                >
                  <img src={image} alt={`${productName}-${index}`} />
                </button>
              ))}

            </div>
          )}

        </div>

        {/* ========================================
            RIGHT - PRODUCT INFORMATION
        ======================================== */}

        <div className="product-information">

          <div className="product-brand">
            {product.brand || product.manufacture || "BRAND"}
          </div>

          <h1 className="product-title">{productName}</h1>

          {/* RATING */}

          <div className="product-rating">

            <div className="stars">

              {[1, 2, 3, 4, 5].map((star) => {
                const starFill =
                  rating >= star
                    ? "full"
                    : rating >= star - 0.5
                    ? "half"
                    : "empty";

                return (
                  <span
                    key={star}
                    className={`rating-star-wrap ${starFill}`}
                  >
                    <Star
                      size={16}
                      className="rating-star-base"
                      fill="none"
                    />

                    {starFill !== "empty" && (
                      <span className="rating-star-fill-layer">
                        <Star
                          size={16}
                          className="rating-star-filled"
                          fill="currentColor"
                        />
                      </span>
                    )}
                  </span>
                );
              })}

            </div>

            <span>{rating}</span>

            <span className="review-count">
              ({reviewCount} Reviews)
            </span>

          </div>

          {/* PRICE */}

          <div className="price-section">

            <span className="current-price">₹{finalPrice}</span>

            {productOffer ? (
              <>
                <span className="original-price">₹{basePrice}</span>

                <span className="discount">
                  {isPercentOffer
                    ? `${offerDiscountValue}% OFFER`
                    : `₹${offerDiscountValue} OFFER`}
                </span>
              </>
            ) : (
              productDiscount > 0 && (
                <>
                  <span className="original-price">
                    ₹{productOriginalPrice}
                  </span>

                  <span className="discount">
                    {productDiscount}% OFF
                  </span>
                </>
              )
            )}

          </div>

          {productOffer && offerSavings > 0 && (
            <div className="offer-savings-line">
              You save ₹{offerSavings} on this order
            </div>
          )}

          {/* ======================================
              PRODUCT OFFER (right below price)
          ====================================== */}

          {productOffer && (
            <div className="product-offers-section">

              <div className="product-offers-header">
                <span className="offers-title-icon">%</span>
                <h3>Offers</h3>
              </div>

              <div className="product-offers-list">

                <div className="product-offer-card">

                  <div className="product-offer-content">

                    <div className="product-offer-title">
                      {productOffer.offerName || "Special Offer"}
                    </div>

                    <div className="product-offer-description">
                      <strong>
                        {isPercentOffer
                          ? `${offerDiscountValue}% discount`
                          : `₹${offerDiscountValue} discount`}
                      </strong>{" "}
                      on this product
                    </div>

                    {productOffer.description && (
                      <div className="product-offer-note">
                        {productOffer.description}
                      </div>
                    )}

                    {productOffer.valid_to && (
                      <div className="product-offer-validity">
                        Valid till{" "}
                        {new Date(
                          productOffer.valid_to
                        ).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric"
                        })}
                      </div>
                    )}

                  </div>

                </div>

              </div>

            </div>
          )}

          {/* SHORT DESCRIPTION */}

          <p className="short-description">
            {selectedVariant?.shortDescription ||
              product?.shortDescription ||
              description}
          </p>

          {/* ======================================
              COLOR
          ====================================== */}

          {colors.length > 0 && (
            <div className="variant-section">

              <div className="variant-title">
                Color

                <strong>{selectedColor}</strong>
              </div>

              <div className="color-options">

                {colors.map((color, index) => (
                  <button
                    key={index}
                    className={`color-option ${
                      selectedColor.toLowerCase() ===
                      color.toLowerCase()
                        ? "selected"
                        : ""
                    }`}
                    onClick={() => handleColorChange(color)}
                  >
                    <span
                      className="color-circle"
                      style={{
                        backgroundColor: color.toLowerCase()
                      }}
                    />

                    <span>{color}</span>
                  </button>
                ))}

              </div>

            </div>
          )}

          {/* ======================================
              SIZE
          ====================================== */}

          {sizes.length > 0 && (
            <div className="variant-section">

              <div className="variant-title">Size</div>

              <div className="size-options">

                {sizes.map((size, index) => {
                  const sizeAvailable = isSizeAvailable(size);

                  return (
                    <button
                      key={index}
                      type="button"
                      disabled={!sizeAvailable}
                      className={`size-option ${
                        selectedSize === String(size).trim()
                          ? "selected"
                          : ""
                      } ${!sizeAvailable ? "unavailable" : ""}`}
                      onClick={() => handleSizeChange(size)}
                    >
                      {size}
                    </button>
                  );
                })}

              </div>

            </div>
          )}

          {/* ======================================
              QUANTITY
          ====================================== */}

          <div className="quantity-section">

            <span className="quantity-label">Quantity</span>

            <div className="quantity-box">

              <button onClick={decreaseQuantity}>
                <Minus size={15} />
              </button>

              <span>{quantity}</span>

              <button onClick={increaseQuantity}>
                <Plus size={15} />
              </button>

            </div>

            <span
              className={`stock-text ${
                stock < 1 ? "out-of-stock-text" : ""
              }`}
            >
              {stock < 1 ? "Out Of Stock" : "Available"}
            </span>

          </div>

          {/* ======================================
              ACTIONS
          ====================================== */}

          <div className="product-actions">

            <button
              className={`add-cart-button ${
                stock < 1 ? "disabled-button" : ""
              }`}
              onClick={handleAddToCart}
              disabled={stock < 1}
            >
              <ShoppingCart size={18} />
              Add to Cart
            </button>

            <button
              className="wishlist-button"
              onClick={handleWishlist}
            >
              <Heart size={18} />
              Wishlist
            </button>

          </div>

          {/* ======================================
              DELIVERY
          ====================================== */}

          <div className="delivery-section">

            <h3>Delivery Options</h3>

            <div className="delivery-location">

              <span className="location-icon">
                <Truck size={20} />
              </span>

              <div>

                <strong>Delivery to </strong>

                <button
                  type="button"
                  className="change-delivery-button"
                  onClick={() => setShowAddressPopup(true)}
                >
                  Change
                </button>

              </div>

            </div>

            <div className="delivery-info">
              <span>✓</span>
              Easy 14 days return & exchange available
            </div>

          </div>

          {/* ======================================
              FEATURES
          ====================================== */}

          <div className="product-features">

            <div>
              <strong>100% Original Products</strong>

              <span>Pay on delivery might be available</span>
            </div>

            <div>
              <strong>Easy Returns</strong>

              <span>Easy 14 days return & exchange</span>
            </div>

          </div>

        </div>

      </section>

      {/* ==========================================
          PRODUCT HIGHLIGHTS
      ========================================== */}

      <section className="product-highlights-section">

        <h2>PRODUCT HIGHLIGHTS</h2>

        <div className="product-highlights-grid">

          {(product.highlights || product.features || []).length >
          0 ? (
            (product.highlights || product.features).map(
              (highlight, index) => (
                <div className="highlight-item" key={index}>
                  <span className="highlight-check">✓</span>

                  <span>
                    {typeof highlight === "string"
                      ? highlight
                      : highlight.title ||
                        highlight.name ||
                        highlight.value ||
                        "Product highlight"}
                  </span>
                </div>
              )
            )
          ) : (
            <>
              <div className="highlight-item">

                <span className="highlight-check">✓</span>

                <span>
                  {manufacturer
                    ? `Manufactured by ${manufacturer}`
                    : "Quality product"}
                </span>

              </div>

              <div className="highlight-item">

                <span className="highlight-check">✓</span>

                <span>
                  {stock < 1
                    ? "Currently unavailable"
                    : "Currently available"}
                </span>

              </div>
            </>
          )}

        </div>

      </section>

      {/* ==========================================
          DESCRIPTION / MANUFACTURER / REVIEW
      ========================================== */}

      <section className="product-description-section">

        <div className="description-tabs">

          <button
            className={activeTab === "description" ? "active" : ""}
            onClick={() => setActiveTab("description")}
          >
            DESCRIPTION
          </button>

          <button
            className={activeTab === "manufacturer" ? "active" : ""}
            onClick={() => setActiveTab("manufacturer")}
          >
            MANUFACTURER
          </button>

          <button
            className={activeTab === "review" ? "active" : ""}
            onClick={() => setActiveTab("review")}
          >
            REVIEW
          </button>

        </div>

        <div className="description-content">

          {activeTab === "description" && <p>{description}</p>}

          {activeTab === "manufacturer" && <p>{manufacturer}</p>}

          {activeTab === "review" && (
            <div className="review-content">

              <h3>Customer Reviews</h3>

              <p>{reviewCount} reviews</p>

              {allReviews.length > 0 ? (
                <div className="reviews-list">

                  {allReviews.map((review, index) => {
                    const reviewImage =
                      review?.image || review?.imageUrl || "";

                    const reviewName =
                      review?.publicName ||
                      review?.userName ||
                      review?.name ||
                      "Customer";

                    const reviewTitle =
                      review?.title || review?.reviewTitle || "";

                    const reviewMessage =
                      review?.reviewText ||
                      review?.comment ||
                      review?.text ||
                      "";

                    const reviewDate = review?.createdAt
                      ? new Date(review.createdAt).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "long",
                            year: "numeric"
                          }
                        )
                      : "";

                    return (
                      <div
                        className="review-item"
                        key={review?.id || review?._id || index}
                      >

                        <div className="review-item-header">

                          <div>

                            <strong>{reviewName}</strong>

                            <div className="stars">

                              {[1, 2, 3, 4, 5].map((star) => {
                                const reviewRating = Number(
                                  review?.rating || 0
                                );

                                const starFill =
                                  reviewRating >= star
                                    ? "full"
                                    : reviewRating >= star - 0.5
                                    ? "half"
                                    : "empty";

                                return (
                                  <span
                                    key={star}
                                    className={`rating-star-wrap review-rating-star ${starFill}`}
                                  >
                                    <Star
                                      size={15}
                                      className="rating-star-base"
                                      fill="none"
                                    />

                                    {starFill !== "empty" && (
                                      <span className="rating-star-fill-layer">
                                        <Star
                                          size={15}
                                          className="rating-star-filled"
                                          fill="currentColor"
                                        />
                                      </span>
                                    )}
                                  </span>
                                );
                              })}

                            </div>

                          </div>

                          {reviewDate && <span>{reviewDate}</span>}

                        </div>

                        {reviewTitle && <h4>{reviewTitle}</h4>}

                        {reviewMessage && <p>{reviewMessage}</p>}

                        {reviewImage && (
                          <img
                            src={getImageUrl(reviewImage)}
                            alt="Customer review"
                            className="review-item-image"
                            onClick={() => {
                              setSelectedReviewImage(reviewImage);

                              setReviewZoomOpen(true);
                            }}
                          />
                        )}

                      </div>
                    );
                  })}

                </div>
              ) : (
                <p>No reviews yet.</p>
              )}

            </div>
          )}

        </div>

      </section>

      {/* ==========================================
          SIMILAR PRODUCTS (separate section)
      ========================================== */}

      {similarProducts.length > 0 && (
        <section className="similar-products-section">

          <div className="similar-header">

            <h2>SIMILAR PRODUCTS</h2>

            <div className="similar-arrows">

              <button
                type="button"
                aria-label="Scroll left"
                onClick={() => scrollSimilar(-1)}
              >
                <ChevronLeft size={17} />
              </button>

              <button
                type="button"
                aria-label="Scroll right"
                onClick={() => scrollSimilar(1)}
              >
                <ChevronRight size={17} />
              </button>

            </div>

          </div>

          <div className="similar-products-grid" ref={similarRef}>

            {similarProducts.map((item) => {
              const itemVariant =
                item.variants?.find((variant) =>
                  variant.productImages?.some(
                    (image) => image?.imageUrl
                  )
                ) || item.variants?.[0];

              const itemImage = getImageUrl(
                itemVariant?.productImages?.find(
                  (image) => image?.imageUrl
                )?.imageUrl
              );

              return (
                <div
                  className="similar-product-card"
                  key={item._id}
                  onClick={() =>
                    navigate(`/productdetail/${item._id}`)
                  }
                >

                  <div className="similar-image">

                    {itemImage ? (
                      <img src={itemImage} alt={item.productName} />
                    ) : (
                      <div>No image</div>
                    )}

                  </div>

                  <h3>{item.productName}</h3>

                  <div className="similar-price">
                    ₹{itemVariant?.price || 0}
                  </div>

                </div>
              );
            })}

          </div>

        </section>
      )}

      {/* ==========================================
          IMAGE ZOOM
      ========================================== */}

      {zoomOpen && productImages.length > 0 && (
        <div
          className="image-zoom-overlay"
          onClick={() => setZoomOpen(false)}
        >

          <button
            className="image-zoom-close"
            onClick={() => setZoomOpen(false)}
            aria-label="Close"
          >
            ×
          </button>

          <img
            className="zoomed-product-image"
            src={productImages[selectedImage]}
            alt={productName}
            onClick={(event) => event.stopPropagation()}
          />

        </div>
      )}

      {reviewZoomOpen && selectedReviewImage && (
        <div
          className="review-image-zoom-overlay"
          onClick={() => setReviewZoomOpen(false)}
        >

          <button
            className="review-image-zoom-close"
            onClick={() => setReviewZoomOpen(false)}
            aria-label="Close review image"
          >
            ×
          </button>

          <img
            className="review-image-zoomed"
            src={selectedReviewImage}
            alt="Customer review"
            onClick={(event) => event.stopPropagation()}
          />

        </div>
      )}

      {popupMessage && (
        <div
          className="product-alert-overlay"
          role="presentation"
          onClick={closePopup}
        >
          <div
            className="product-alert-popup"
            role="alertdialog"
            aria-modal="true"
            aria-live="assertive"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="product-alert-icon" aria-hidden="true">!</div>
            <p className="product-alert-message">{popupMessage}</p>
            <button
              type="button"
              className="product-alert-button"
              onClick={closePopup}
              autoFocus
            >
              OK
            </button>
          </div>
        </div>
      )}

      {showAddressPopup && (
        <AddressPopup
          onClose={() => setShowAddressPopup(false)}
          selectedAddress={selectedAddress}
          onSelectAddress={(address) => {
            setSelectedAddress(address);
          }}
        />
      )}

    </div>
  );
};

export default ProductDetails;