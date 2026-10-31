import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./Addproduct.css";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});
const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  // =====================================
  // PRODUCT DATA
  // =====================================
  const [productData, setProductData] = useState({
    productName: "",
    category: "",
    material: "",
    manufacture: "",
    status: "active",
  });
  // =====================================
  // VARIANTS
  // =====================================
  const [variants, setVariants] = useState([]);
  // =====================================
  // CATEGORY / MATERIAL
  // =====================================
  const [categories, setCategories] = useState([]);
  const [materials, setMaterials] = useState([]);
  // =====================================
  // LOADING
  // =====================================
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // =====================================
  // FETCH CATEGORIES
  // =====================================
  const fetchCategories = async () => {
    try {
      const response = await api.get("/admin/category");
      console.log(
        "CATEGORY RESPONSE:",
        response.data
      );
      const categoryData =
        response.data?.data || [];
      setCategories(
        Array.isArray(categoryData)
          ? categoryData
          : []
      );
    } catch (error) {
      console.error(
        "CATEGORY FETCH ERROR:",
        error.response?.data || error
      );
    }
  };
  // =====================================
  // FETCH MATERIALS
  // =====================================
  const fetchMaterials = async () => {
    try {
      const response = await api.get(
        "/meterial"
      );
      console.log(
        "MATERIAL RESPONSE:",
        response.data
      );
      const materialData =
        response.data?.data || [];
      setMaterials(
        Array.isArray(materialData)
          ? materialData
          : []
      );
    } catch (error) {
      console.error(
        "MATERIAL FETCH ERROR:",
        error.response?.data || error
      );
    }
  };
  // =====================================
  // FETCH PRODUCT + VARIANTS
  // =====================================
  const fetchProduct = async () => {
    try {
      setLoading(true);
      // =================================
      // GET PRODUCT
      // =================================
      const productResponse =
        await api.get(`/product/${id}`);
      console.log(
        "PRODUCT RESPONSE:",
        productResponse.data
      );
      const product =
        productResponse.data?.data;
      if (!product) {
        console.error(
          "Product not found"
        );
        return;
      }
      // =================================
      // SET PRODUCT DATA
      // =================================
      setProductData({
        productName:
          product.productName || "",
        category:
          product.categoryId?._id ||
          product.categoryId ||
          "",
        material:
          product.meterialId?._id ||
          product.meterialId ||
          "",
        manufacture:
          product.manufacture || "",
        status:
          product.status || "active",
      });
      // =================================
      // GET ONLY THIS PRODUCT'S VARIANTS
      // =================================
      const variantResponse =
        await api.get(
          `/productvarient?productId=${id}&limit=100`
        );
      console.log(
        "EDIT PRODUCT ID:",
        id
      );
      console.log(
        "VARIANT RESPONSE:",
        variantResponse.data
      );
      const productVariants =
        variantResponse.data?.data || [];
      console.log(
        "PRODUCT VARIANTS:",
        productVariants
      );
      // =================================
      // FORMAT VARIANTS
      // =================================
      const formattedVariants =
        productVariants.map(
          (variant) => ({
            id: variant._id,
            variantName:
              variant.variantName || "",
            skuCode:
              variant.skucode || "",
            stock:
              variant.stock ?? "",
            color:
              variant.color || "",
            size:
              variant.size || "",
            discount:
              variant.discount ?? "",
            price:
              variant.price ?? "",
            shortDescription:
              variant.shortDescription || "",
            longDescription:
              variant.longDescription || "",
            // =================================
            // EXISTING IMAGES FROM DATABASE
            // =================================
            existingImages:
              Array.isArray(
                variant.productImages
              )
                ? variant.productImages
                : [],
            // New images
            images: [],
            // New image previews
            imagePreviews: [],
          })
        );
      console.log(
        "FORMATTED VARIANTS:",
        formattedVariants
      );
      // =================================
      // CHECK EXISTING IMAGES
      // =================================
      console.log(
        "EXISTING IMAGES:",
        productVariants[0]?.productImages
      );
      setVariants(
        formattedVariants
      );
    } catch (error) {
      console.error(
        "GET EDIT PRODUCT ERROR:",
        error.response?.data || error
      );
    } finally {
      setLoading(false);
    }
  };
  // =====================================
  // INITIAL LOAD
  // =====================================
  useEffect(() => {
    fetchCategories();
    fetchMaterials();
    fetchProduct();
  }, [id]);
  // =====================================
  // PRODUCT INPUT CHANGE
  // =====================================
  const handleProductChange = (e) => {
    const { name, value } = e.target;
    setProductData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };
  // =====================================
  // VARIANT INPUT CHANGE
  // =====================================
  const handleVariantChange = (
    index,
    e
  ) => {
    const { name, value } = e.target;
    setVariants((previous) =>
      previous.map(
        (variant, variantIndex) =>
          variantIndex === index
            ? {
                ...variant,
                [name]: value,
              }
            : variant
      )
    );
  };
  // =====================================
  // NEW IMAGE SELECT
  // =====================================
  const handleImageChange = (
    index,
    e
  ) => {
    const files = Array.from(
      e.target.files
    );
    if (!files.length) {
      return;
    }
    const currentImages =
      variants[index].images || [];
    if (
      currentImages.length +
        files.length >
      10
    ) {
      alert(
        "Maximum 10 new images are allowed"
      );
      e.target.value = "";
      return;
    }
    const previews = files.map(
      (file) =>
        URL.createObjectURL(file)
    );
    setVariants((previous) =>
      previous.map(
        (variant, variantIndex) =>
          variantIndex === index
            ? {
                ...variant,
                images: [
                  ...variant.images,
                  ...files,
                ],
                imagePreviews: [
                  ...variant.imagePreviews,
                  ...previews,
                ],
              }
            : variant
      )
    );
    e.target.value = "";
  };
  // =====================================
  // REMOVE NEW IMAGE
  // =====================================
  const handleRemoveNewImage = (
    variantIndex,
    imageIndex
  ) => {
    setVariants((previous) =>
      previous.map(
        (variant, index) => {
          if (
            index !== variantIndex
          ) {
            return variant;
          }
          return {
            ...variant,
            images:
              variant.images.filter(
                (_, i) =>
                  i !== imageIndex
              ),
            imagePreviews:
              variant.imagePreviews.filter(
                (_, i) =>
                  i !== imageIndex
              ),
          };
        }
      )
    );
  };
  // =====================================
  // REMOVE EXISTING IMAGE
  // =====================================
  const handleRemoveExistingImage = (variantIndex, imageIndex) => {
    setVariants((previous) =>
      previous.map((variant, index) =>
        index === variantIndex
          ? {
              ...variant,
              existingImages: variant.existingImages.filter(
                (_, i) => i !== imageIndex
              ),
            }
          : variant
      )
    );
  };

  // =====================================
  // UPDATE PRODUCT
  // =====================================
  const handleUpdate = async () => {
    try {
      setSaving(true);
      // =================================
      // UPDATE PRODUCT
      // =================================
      console.log(
        "UPDATING PRODUCT:",
        productData
      );
      await api.put(
        `/product/update/${id}`,
        {
          productName:
            productData.productName,
          categoryId:
            productData.category,
          meterialId:
            productData.material,
          manufacture:
            productData.manufacture,
          status:
            productData.status,
        }
      );
      // =================================
      // UPDATE VARIANTS
      // =================================
      for (const variant of variants) {
        const formData =
          new FormData();
        formData.append(
          "productId",
          id
        );
        formData.append(
          "variantName",
          variant.variantName
        );
        formData.append(
          "skucode",
          variant.skuCode
        );
        formData.append(
          "stock",
          variant.stock
        );
        formData.append(
          "color",
          variant.color
        );
        formData.append(
          "size",
          variant.size
        );
        formData.append(
          "discount",
          variant.discount || 0
        );
        formData.append(
          "price",
          variant.price
        );
        formData.append(
          "shortDescription",
          variant.shortDescription
        );
        formData.append(
          "longDescription",
          variant.longDescription
        );
        // =================================
        // NEW IMAGES
        // =================================
        if (
          variant.images &&
          variant.images.length > 0
        ) {
          variant.images.forEach(
            (image) => {
              formData.append(
                "images",
                image
              );
            }
          );
        }
        // =================================
        // UPDATE EXISTING VARIANT
        // =================================
        if (variant.id) {
          console.log(
            "UPDATING VARIANT:",
            variant.id
          );
          await api.put(
            `/productvarient/edit/${variant.id}`,
            formData,
            {
              headers: {
                "Content-Type":
                  "multipart/form-data",
              },
            }
          );
        }
      }
      alert(
        "Product updated successfully"
      );
      navigate(
        "/admin/product"
      );
    } catch (error) {
      console.error(
        "UPDATE PRODUCT ERROR:",
        error.response?.data || error
      );
      alert(
        error.response?.data?.message ||
          "Failed to update product"
      );
    } finally {
      setSaving(false);
    }
  };
  // =====================================
  // LOADING
  // =====================================
  if (loading) {
    return (
      <div className="add-product">
        <div className="page-header">
          <h2>
            Loading product...
          </h2>
        </div>
      </div>
    );
  }
  // =====================================
  // JSX
  // =====================================
  return (
    <div className="add-product">
      {/* HEADER */}
      <div className="page-header">
        <h2>
          Products Edit
        </h2>
      </div>
      {/* PRODUCT INFORMATION */}
      <div className="product-information">
        <h3>
          ◈ Product Information
        </h3>
        <div className="form-row">
          <div className="form-group">
            <label>
              Product Name
            </label>
            <input
              type="text"
              name="productName"
              value={
                productData.productName
              }
              onChange={
                handleProductChange
              }
            />
          </div>
          <div className="form-group">
            <label>
              Category
            </label>
            <select
              name="category"
              value={
                productData.category
              }
              onChange={
                handleProductChange
              }
            >
              <option value="">
                Select Category
              </option>
              {categories.map(
                (category) => (
                  <option
                    key={
                      category._id
                    }
                    value={
                      category._id
                    }
                  >
                    {
                      category.categoryName
                    }
                  </option>
                )
              )}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>
              Material
            </label>
            <select
              name="material"
              value={
                productData.material
              }
              onChange={
                handleProductChange
              }
            >
              <option value="">
                Select Material
              </option>
              {materials.map(
                (material) => (
                  <option
                    key={
                      material._id
                    }
                    value={
                      material._id
                    }
                  >
                    {
                      material.MeterialName
                    }
                  </option>
                )
              )}
            </select>
          </div>
          <div className="form-group">
            <label>
              Manufacture
            </label>
            <input
              type="text"
              name="manufacture"
              value={
                productData.manufacture
              }
              onChange={
                handleProductChange
              }
            />
          </div>
        </div>
      </div>
      {/* PRODUCT VARIANTS */}
      <div className="variants-section">
        <h3>
          ◈ Product Variants
        </h3>
        {variants.length === 0 ? (
          <p>
            No variants found for this
            product.
          </p>
        ) : (
          variants.map(
            (variant, index) => (
              <div
                className="variant-card"
                key={
                  variant.id ||
                  index
                }
              >
                {/* ROW 1 */}
                <div className="form-row">
                  <div className="form-group">
                    <label>
                      Variant Name
                    </label>
                    <input
                      type="text"
                      name="variantName"
                      value={
                        variant.variantName
                      }
                      onChange={(e) =>
                        handleVariantChange(
                          index,
                          e
                        )
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      SKU Code
                    </label>
                    <input
                      type="text"
                      name="skuCode"
                      value={
                        variant.skuCode
                      }
                      onChange={(e) =>
                        handleVariantChange(
                          index,
                          e
                        )
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      Stock
                    </label>
                    <input
                      type="number"
                      name="stock"
                      value={
                        variant.stock
                      }
                      onChange={(e) =>
                        handleVariantChange(
                          index,
                          e
                        )
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      Color
                    </label>
                    <input
                      type="text"
                      name="color"
                      value={
                        variant.color
                      }
                      onChange={(e) =>
                        handleVariantChange(
                          index,
                          e
                        )
                      }
                    />
                  </div>
                </div>
                {/* ROW 2 */}
                <div className="form-row">
                  <div className="form-group">
                    <label>
                      Size
                    </label>
                    <input
                      type="text"
                      name="size"
                      value={
                        variant.size
                      }
                      onChange={(e) =>
                        handleVariantChange(
                          index,
                          e
                        )
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      Discount (%)
                    </label>
                    <input
                      type="number"
                      name="discount"
                      value={
                        variant.discount
                      }
                      onChange={(e) =>
                        handleVariantChange(
                          index,
                          e
                        )
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={
                        variant.price
                      }
                      onChange={(e) =>
                        handleVariantChange(
                          index,
                          e
                        )
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      Short Description
                    </label>
                    <input
                      type="text"
                      name="shortDescription"
                      value={
                        variant.shortDescription
                      }
                      onChange={(e) =>
                        handleVariantChange(
                          index,
                          e
                        )
                      }
                    />
                  </div>
                </div>
                {/* LONG DESCRIPTION */}
                <div className="form-group">
                  <label>
                    Long Description
                  </label>
                  <textarea
                    name="longDescription"
                    value={
                      variant.longDescription
                    }
                    onChange={(e) =>
                      handleVariantChange(
                        index,
                        e
                      )
                    }
                  />
                </div>
                {/* EXISTING IMAGES */}
                <div className="form-group">
                  <label>
                    Existing Images
                  </label>
                  <div className="image-preview-container">
                    {variant
                      .existingImages
                      ?.length > 0 ? (
                      variant.existingImages.map(
                        (
                          image,
                          imageIndex
                        ) => {
                          const imageUrl =
                            image?.imageUrl ||
                            image;
                          return (
                            <div
                              className="image-preview"
                              key={
                                imageIndex
                              }
                            >
                              <img
                                src={
                                  imageUrl?.startsWith("http")
  ? imageUrl
  : `${import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, "")}/uploads/${imageUrl}`
                                }
                                alt={`Existing ${
                                  imageIndex +
                                  1
                                }`}
                              />
                              <button
                                type="button"
                                className="remove-image-btn"
                                onClick={() =>
                                  handleRemoveExistingImage(index, imageIndex)
                                }
                                title="Remove image"
                              >
                                ×
                              </button>
                            </div>
                          );
                        }
                      )
                    ) : (
                      <p>
                        No existing images
                      </p>
                    )}
                  </div>
                </div>
                {/* UPLOAD NEW IMAGES */}
                <div className="form-group">
                  <label>
                    Upload New Images
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/\*"
                    onChange={(e) =>
                      handleImageChange(
                        index,
                        e
                      )
                    }
                  />
                </div>
                {/* NEW IMAGE PREVIEW */}
                {variant
                  .imagePreviews
                  ?.length > 0 && (
                  <div className="form-group">
                    <label>
                      New Images
                    </label>
                    <div className="image-preview-container">
                      {variant.imagePreviews.map(
                        (
                          preview,
                          imageIndex
                        ) => (
                          <div
                            className="image-preview"
                            key={
                              imageIndex
                            }
                          >
                            <img
                              src={preview}
                              alt="New product"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveNewImage(
                                  index,
                                  imageIndex
                                )
                              }
                            >
                              ×
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          )
        )}
      </div>
      {/* BUTTONS */}
      <div className="form-actions">
        <button
          type="button"
          className="save-btn"
          onClick={
            handleUpdate
          }
          disabled={saving}
        >
          {saving
            ? "Updating..."
            : "Update Product"}
        </button>
        <button
          type="button"
          className="cancel-btn"
          onClick={() =>
            navigate(
              "/admin/product"
            )
          }
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
export default EditProduct;
