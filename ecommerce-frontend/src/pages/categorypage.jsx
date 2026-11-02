import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";
import "./categorypage.css";

const CategoryPage = () => {
  const { type } = useParams();
  const navigate = useNavigate();

  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [offers, setOffers] = useState([]);

  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);

  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);

  const [sortBy, setSortBy] = useState("default");

  const sortOptions = [
    { value: "default", label: "Default" },
    { value: "name-asc", label: "A → Z" },
    { value: "name-desc", label: "Z → A" },
    { value: "price-asc", label: "Price: Low → High" },
    { value: "price-desc", label: "Price: High → Low" }
  ];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 4;

  /* ==========================================
     HELPERS
  ========================================== */

  const normalizeSize = (value) => {
    if (value === undefined || value === null) return "";

    const valueString = String(value).trim();
    if (valueString === "") return "";

    const numericValue = Number(valueString);

    if (!Number.isNaN(numericValue)) {
      return String(numericValue);
    }

    return valueString.toLowerCase();
  };

  const hasImage = (variant) =>
    variant?.productImages?.some(
      (image) => image?.imageUrl && String(image.imageUrl).trim() !== ""
    );

  /* ==========================================
     FETCH CATEGORY PRODUCTS
  ========================================== */

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await API.get(`/product/category/product/${type}`);

        const categoryData = response.data.category;

        // Only active products
        const productData = (response.data.products || []).filter(
          (product) => product.status === "active"
        );

        setCategory(categoryData);
        setProducts(productData);

        // Offers
        try {
          const offerResponse = await API.get("/offers");

          const offerData =
            offerResponse.data?.data || offerResponse.data?.offers || [];

          setOffers(Array.isArray(offerData) ? offerData : []);
        } catch (offerError) {
          console.error("CATEGORY OFFER ERROR:", offerError);
          setOffers([]);
        }

        // Unique colors and sizes from all variants
        const allColors = [];
        const allSizes = [];

        productData.forEach((product) => {
          product.variants?.forEach((variant) => {
            if (variant.color !== undefined && variant.color !== null) {
              const color = String(variant.color).trim();

              if (
                color &&
                !allColors.some(
                  (item) =>
                    String(item).trim().toLowerCase() === color.toLowerCase()
                )
              ) {
                allColors.push(color);
              }
            }

            if (variant.size !== undefined && variant.size !== null) {
              const size = String(variant.size).trim();

              if (
                size &&
                !allSizes.some((item) => String(item).trim() === size)
              ) {
                allSizes.push(size);
              }
            }
          });
        });

        setColors(allColors);
        setSizes(allSizes);

        setCurrentPage(1);
      } catch (error) {
        console.error("CATEGORY PRODUCT ERROR:", error);

        setError(
          error?.response?.data?.message || "Failed to load products"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryProducts();
  }, [type]);

  /* ==========================================
     GROUP PRODUCTS WITH THE SAME NAME

     If the same product was saved as several
     product documents (same productName), they
     are shown as ONE card. Every variant keeps
     the id of the product that owns it
     (_productId) so the card opens the right page.
  ========================================== */

  const groupedProducts = useMemo(() => {
    const map = new Map();

    products.forEach((product) => {
      const key =
        String(product.productName || "").trim().toLowerCase() ||
        String(product._id);

      const taggedVariants = (product.variants || []).map((variant) => ({
        ...variant,
        _productId: product._id
      }));

      if (!map.has(key)) {
        map.set(key, {
          key,
          _id: product._id,
          productName: product.productName,
          sources: [product],
          variants: taggedVariants
        });
      } else {
        const group = map.get(key);
        group.sources.push(product);
        group.variants.push(...taggedVariants);
      }
    });

    return [...map.values()];
  }, [products]);

  /* ==========================================
     FILTER HANDLERS
  ========================================== */

  const handleColorChange = (color) => {
    setSelectedColors((prev) =>
      prev.includes(color)
        ? prev.filter((item) => item !== color)
        : [...prev, color]
    );

    setCurrentPage(1);
  };

  const handleSizeChange = (size) => {
    setSelectedSizes((prev) =>
      prev.includes(size)
        ? prev.filter((item) => item !== size)
        : [...prev, size]
    );

    setCurrentPage(1);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  /* ==========================================
     FILTER GROUPS USING THEIR VARIANTS
  ========================================== */

  const filteredProducts = groupedProducts.filter((group) => {
    const variants = group.variants || [];

    const colorMatch =
      selectedColors.length === 0 ||
      variants.some((variant) => {
        if (variant.color === undefined || variant.color === null) {
          return false;
        }

        const variantColor = String(variant.color).trim().toLowerCase();

        return selectedColors.some(
          (selectedColor) =>
            String(selectedColor).trim().toLowerCase() === variantColor
        );
      });

    const sizeMatch =
      selectedSizes.length === 0 ||
      variants.some((variant) => {
        const variantSize = normalizeSize(variant.size);

        if (!variantSize) return false;

        return selectedSizes.some(
          (selectedSize) => normalizeSize(selectedSize) === variantSize
        );
      });

    return colorMatch && sizeMatch;
  });

  /* ==========================================
     VARIANT SHOWN ON THE CARD

     Prefer a variant that matches the active
     color / size filters and has an image.
  ========================================== */

  const getDisplayVariant = (group) => {
    const variants = group.variants || [];

    const matching = variants.filter((variant) => {
      const colorOk =
        selectedColors.length === 0 ||
        selectedColors.some(
          (selectedColor) =>
            String(selectedColor).trim().toLowerCase() ===
            String(variant.color || "").trim().toLowerCase()
        );

      const sizeOk =
        selectedSizes.length === 0 ||
        selectedSizes.some(
          (selectedSize) =>
            normalizeSize(selectedSize) === normalizeSize(variant.size)
        );

      return colorOk && sizeOk;
    });

    const pool = matching.length > 0 ? matching : variants;

    return pool.find(hasImage) || pool[0];
  };

  // The product document that owns the shown variant
  const getSourceProduct = (group, variant) =>
    group.sources.find(
      (source) => String(source._id) === String(variant?._productId)
    ) || group.sources[0];

  /* ==========================================
     IMAGE
  ========================================== */

  const getHostedImageUrl = (image) => {
    if (!image) return null;

    const API_ORIGIN = (
      import.meta.env.VITE_API_BASE_URL ||
      "https://aureyaforwomen.shop/api"
    ).replace(/\/api\/?$/, "");

    let imagePath = String(image).trim();

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

  const getVariantImage = (variant) => {
    const imageObject = variant?.productImages?.find(
      (image) => image?.imageUrl && String(image.imageUrl).trim() !== ""
    );

    return getHostedImageUrl(imageObject?.imageUrl);
  };

  /* ==========================================
     OFFERS
     PRIORITY: PRODUCT -> CATEGORY -> COMMON
  ========================================== */

  const getApplicableOffer = (product) => {
    if (!Array.isArray(offers) || offers.length === 0) return null;

    const now = new Date();

    const isCurrentlyValid = (offer) => {
      if (String(offer?.offer_status || "").toLowerCase() !== "active") {
        return false;
      }

      if (offer?.valid_from && new Date(offer.valid_from) > now) {
        return false;
      }

      if (offer?.valid_to && new Date(offer.valid_to) < now) {
        return false;
      }

      return true;
    };

    const validOffers = offers.filter(isCurrentlyValid);

    const productId = product?._id;

    const categoryId =
      product?.category?._id ||
      product?.categoryId?._id ||
      product?.categoryId ||
      product?.category;

    const productOffer = validOffers.find((offer) => {
      if (String(offer?.offerType || "").toLowerCase() !== "product") {
        return false;
      }

      const offerProductId = offer?.productId?._id || offer?.productId;

      return productId && String(offerProductId) === String(productId);
    });

    if (productOffer) return productOffer;

    const categoryOffer = validOffers.find((offer) => {
      if (String(offer?.offerType || "").toLowerCase() !== "category") {
        return false;
      }

      const offerCategoryId = offer?.categoryId?._id || offer?.categoryId;

      return categoryId && String(offerCategoryId) === String(categoryId);
    });

    if (categoryOffer) return categoryOffer;

    return (
      validOffers.find(
        (offer) => String(offer?.offerType || "").toLowerCase() === "common"
      ) || null
    );
  };

  const getOfferPrice = (price, offer) => {
    const basePrice = Number(price || 0);

    if (!offer || basePrice <= 0) {
      return { finalPrice: basePrice, hasOffer: false };
    }

    const discountType = String(offer?.discounttype || "").toLowerCase();
    const discountValue = Number(offer?.discountvalue || 0);

    if (discountValue <= 0) {
      return { finalPrice: basePrice, hasOffer: false };
    }

    let finalPrice = basePrice;

    if (discountType === "percentage" || discountType === "percent") {
      finalPrice = Math.max(
        0,
        Math.round(basePrice - (basePrice * discountValue) / 100)
      );
    } else if (discountType === "fixed" || discountType === "amount") {
      finalPrice = Math.max(0, Math.round(basePrice - discountValue));
    }

    return { finalPrice, hasOffer: finalPrice < basePrice };
  };

  /* ==========================================
     SORT
  ========================================== */

  const getSortPrice = (group) => {
    const variant = getDisplayVariant(group);
    const source = getSourceProduct(group, variant);
    const offer = getApplicableOffer(source);

    return getOfferPrice(variant?.price, offer).finalPrice;
  };

  // Case-insensitive, number-aware name compare ("Heel 2" before "Heel 10")
  const compareNames = (a, b) =>
    String(a.productName || "")
      .trim()
      .localeCompare(String(b.productName || "").trim(), undefined, {
        sensitivity: "base",
        numeric: true
      });

  // Work out each price once, then sort (works together with filters)
  const sortedProducts = (() => {
    if (sortBy === "default") return filteredProducts;

    const withPrice = filteredProducts.map((group) => ({
      group,
      price: sortBy.startsWith("price") ? getSortPrice(group) : 0
    }));

    withPrice.sort((a, b) => {
      if (sortBy === "name-asc") return compareNames(a.group, b.group);

      if (sortBy === "name-desc") return compareNames(b.group, a.group);

      const priceDiff =
        sortBy === "price-asc" ? a.price - b.price : b.price - a.price;

      // same price -> A → Z so the order is always stable
      return priceDiff !== 0 ? priceDiff : compareNames(a.group, b.group);
    });

    return withPrice.map((item) => item.group);
  })();

  /* ==========================================
     PAGINATION
  ========================================== */

  const totalPages = Math.ceil(sortedProducts.length / productsPerPage);

  const startIndex = (currentPage - 1) * productsPerPage;

  const paginatedProducts = sortedProducts.slice(
    startIndex,
    startIndex + productsPerPage
  );

  if (loading) {
    return <div className="category-loading">Loading...</div>;
  }

  if (error) {
    return <div className="category-error">{error}</div>;
  }

  const getPaginationPages = () => {
    const pages = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }

      return pages;
    }

    pages.push(1);

    if (currentPage > 3) {
      pages.push("...");
    }

    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);

    for (let i = startPage; i <= endPage; i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }

    if (currentPage < totalPages - 2) {
      pages.push("...");
    }

    if (!pages.includes(totalPages)) {
      pages.push(totalPages);
    }

    return pages;
  };

  const isPercent = (offer) => {
    const discountType = String(offer?.discounttype || "").toLowerCase();

    return discountType === "percentage" || discountType === "percent";
  };

  /* ==========================================
     PAGE
  ========================================== */

  return (
    <div className="category-page">
      {/* CATEGORY BANNER */}

      {category && (
        <div className="category-banner">
          <img
            src={getHostedImageUrl(category.image)}
            alt={category.categoryName}
          />

          <div className="category-banner-overlay">
            <h1>{category.categoryName}</h1>

            <p>{category.description}</p>
          </div>
        </div>
      )}

      {/* TRENDING TITLE */}

      <div className="trending-heading">
        <h2>Trending {category?.categoryName} Collection</h2>
      </div>

      {/* TRENDING 2 PRODUCTS */}

      <div className="trending-cards">
        {groupedProducts.slice(0, 2).map((group) => {
          const variant =
            group.variants.find(hasImage) || group.variants[0];

          const image = getVariantImage(variant);

          return (
            <div
              className="trending-card"
              key={group.key}
              onClick={() =>
                navigate(
                  `/productdetail/${variant?._productId || group._id}`
                )
              }
            >
              {image && (
                <img
                  src={image}
                  alt={group.productName}
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              )}

              <div className="trending-card-title">{group.productName}</div>
            </div>
          );
        })}
      </div>

      {/* VIEW ALL PRODUCTS */}

      <div className="view-products">
        <button
          onClick={() => {
            document
              .getElementById("all-products")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          View All Products
        </button>
      </div>

      {/* PRODUCTS AREA */}

      <div className="products-container" id="all-products">
        {/* FILTER */}

        <aside className="product-filter">
          {/* SORT BY */}

          <div className="filter-section sort-section">
            <h3>SORT BY</h3>

            {sortOptions.map((option) => (
              <label key={option.value} className="filter-option">
                <input
                  type="radio"
                  name="sort-by"
                  checked={sortBy === option.value}
                  onChange={() => handleSortChange(option.value)}
                />

                <span>{option.label}</span>
              </label>
            ))}
          </div>

          {/* COLORS */}

          <div className="filter-section">
            <h3>COLORS</h3>

            {colors.map((color) => (
              <label key={color} className="filter-option">
                <input
                  type="checkbox"
                  checked={selectedColors.includes(color)}
                  onChange={() => handleColorChange(color)}
                />

                <span>{color}</span>
              </label>
            ))}
          </div>

          {/* SIZE */}

          <div className="filter-section size-section">
            <h3>SIZE</h3>

            <div className="size-grid">
              {sizes.map((size) => (
                <button
                  key={size}
                  className={
                    selectedSizes.includes(size)
                      ? "size-button active"
                      : "size-button"
                  }
                  onClick={() => handleSizeChange(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* PRODUCT GRID */}

        <section className="products-section">
          {filteredProducts.length === 0 ? (
            <div className="no-products">No products found</div>
          ) : (
            <>
              <div className="product-grid">
                {paginatedProducts.map((group) => {
                  const variant = getDisplayVariant(group);
                  const source = getSourceProduct(group, variant);
                  const image = getVariantImage(variant);

                  return (
                    <div
                      className="product-card"
                      key={group.key}
                      onClick={() =>
                        navigate(`/productdetail/${source._id}`)
                      }
                    >
                      {/* PRODUCT IMAGE */}

                      <div className="product-image">
                        {image && (
                          <img
                            src={image}
                            alt={group.productName}
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        )}
                      </div>

                      {/* PRODUCT NAME */}

                      <h4>{group.productName}</h4>

                      {/* PRODUCT PRICE */}

                      {variant &&
                        (() => {
                          const offer = getApplicableOffer(source);

                          const priceDetails = getOfferPrice(
                            variant.price,
                            offer
                          );

                          return (
                            <div className="product-price">
                              {priceDetails.hasOffer ? (
                                <>
                                  <div className="offer-price-row">
                                    <span className="offer-price">
                                      ₹
                                      {priceDetails.finalPrice.toLocaleString(
                                        "en-IN"
                                      )}
                                    </span>

                                    <span className="offer-badge">
                                      {isPercent(offer)
                                        ? `${offer.discountvalue}% OFF`
                                        : `₹${Number(
                                            offer.discountvalue
                                          ).toLocaleString("en-IN")} OFF`}
                                    </span>
                                  </div>

                                  <div className="original-price">
                                    ₹
                                    {Number(variant.price).toLocaleString(
                                      "en-IN"
                                    )}
                                  </div>
                                </>
                              ) : (
                                <span className="normal-price">
                                  ₹
                                  {Number(variant.price).toLocaleString(
                                    "en-IN"
                                  )}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                    </div>
                  );
                })}
              </div>

              {/* PAGINATION */}

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination-arrow"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                  >
                    ‹
                  </button>

                  {getPaginationPages().map((page, index) => {
                    if (page === "...") {
                      return (
                        <span key={`dots-${index}`} className="pagination-dots">
                          ...
                        </span>
                      );
                    }

                    return (
                      <button
                        key={page}
                        className={currentPage === page ? "active" : ""}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    className="pagination-arrow"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                  >
                    ›
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default CategoryPage;