import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cropper from "react-easy-crop";
import "./Addproduct.css";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

const AddProduct = () => {
  const navigate = useNavigate();

  // =========================
  // PRODUCT DATA
  // =========================

  const [productData, setProductData] = useState({
    productName: "",
    skuCode: "",
    category: "",
    price: "",
    discount: "",
    material: "",
    manufacture: "",
  });

  // =========================
  // CATEGORY DATA
  // =========================

  const [categories, setCategories] = useState([]);

  // =========================
  // MATERIAL DATA
  // =========================

  const [materials, setMaterials] = useState([]);

  // =========================
  // VARIANT DATA
  // =========================

  const [variants, setVariants] = useState([
    {
      variantName: "",
      skuCode: "",
      stock: "",
      color: "",
      size: "",
      discount: "",
      price: "",
      shortDescription: "",
      longDescription: "",
      images: [],
      imagePreviews: [],
      isPrimary: false,
    },
  ]);

  // ==================================================
  // IMAGE CROP STATE
  // ==================================================

  const [croppingImage, setCroppingImage] = useState(null);

  const [croppingVariantIndex, setCroppingVariantIndex] =
    useState(null);

  const [crop, setCrop] = useState({
    x: 0,
    y: 0,
  });

  const [zoom, setZoom] = useState(1);

  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState(null);

  // ==================================================
  // FETCH CATEGORY AND MATERIAL
  // ==================================================

  useEffect(() => {
    const fetchCategoryAndMaterial = async () => {
      try {
        // =========================
        // FETCH CATEGORY
        // =========================

        const categoryResponse =
          await API.get("/admin/category");

        console.log(
          "CATEGORY RESPONSE:",
          categoryResponse.data
        );

        const categoryData =
          categoryResponse.data?.data ||
          categoryResponse.data;

        setCategories(
          Array.isArray(categoryData)
            ? categoryData
            : []
        );

        // =========================
        // FETCH MATERIAL
        // =========================

        const materialResponse =
          await API.get("/meterial");

        console.log(
          "MATERIAL RESPONSE:",
          materialResponse.data
        );

        const materialData =
          materialResponse.data?.data ||
          materialResponse.data;

        setMaterials(
          Array.isArray(materialData)
            ? materialData
            : []
        );
      } catch (error) {
        console.error(
          "FETCH CATEGORY/MATERIAL ERROR:",
          error.response?.data || error
        );
      }
    };

    fetchCategoryAndMaterial();
  }, []);

  // =========================
  // PRODUCT INPUT CHANGE
  // =========================

  const handleProductChange = (e) => {
    const { name, value } = e.target;

    setProductData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================
  // VARIANT INPUT CHANGE
  // =========================

  const handleVariantChange = (index, e) => {
    const { name, value } = e.target;

    setVariants((previous) =>
      previous.map((variant, variantIndex) =>
        variantIndex === index
          ? {
              ...variant,
              [name]: value,
            }
          : variant
      )
    );
  };

  // =========================
  // ADD VARIANT
  // =========================

  const handleAddVariant = () => {
    setVariants((previous) => [
      ...previous,
      {
        variantName: "",
        skuCode: "",
        stock: "",
        color: "",
        size: "",
        discount: "",
        price: "",
        shortDescription: "",
        longDescription: "",
        images: [],
        imagePreviews: [],
        isPrimary: false,
      },
    ]);
  };

  // =========================
  // REMOVE VARIANT
  // =========================

  const handleRemoveVariant = (index) => {
    setVariants((previous) =>
      previous.filter(
        (_, variantIndex) =>
          variantIndex !== index
      )
    );
  };

  // ==================================================
  // IMAGE SELECT
  // ==================================================

  const handleImageChange = (index, e) => {
    const file = e.target.files[0];

    if (!file) {
      return;
    }

    // Maximum 10 images
    if (variants[index].images.length >= 10) {
      alert(
        "Maximum 10 images are allowed"
      );

      e.target.value = "";

      return;
    }

    // Create temporary image URL
    const imageUrl =
      URL.createObjectURL(file);

    // Open crop screen
    setCroppingImage(imageUrl);

    // Remember which variant
    setCroppingVariantIndex(index);

    // Reset crop
    setCrop({
      x: 0,
      y: 0,
    });

    setZoom(1);

    setCroppedAreaPixels(null);

    // Allow selecting same image again
    e.target.value = "";
  };

  // ==================================================
  // CROP COMPLETE
  // ==================================================

  const onCropComplete = (
    croppedArea,
    croppedAreaPixels
  ) => {
    setCroppedAreaPixels(
      croppedAreaPixels
    );
  };

  // ==================================================
  // CREATE CROPPED + RESIZED IMAGE
  // ==================================================

  const createCroppedImage = async (
    imageSrc,
    pixelCrop
  ) => {
    const image = new Image();

    image.src = imageSrc;

    await new Promise((resolve, reject) => {
      image.onload = resolve;

      image.onerror = reject;
    });

    const canvas =
      document.createElement("canvas");

    const ctx =
      canvas.getContext("2d");

    // =========================
    // FINAL IMAGE SIZE
    // =========================

    const MAX_WIDTH = 800;
    const MAX_HEIGHT = 800;

    let width = pixelCrop.width;
    let height = pixelCrop.height;

    // =========================
    // RESIZE
    // =========================

    if (
      width > MAX_WIDTH ||
      height > MAX_HEIGHT
    ) {
      const ratio = Math.min(
        MAX_WIDTH / width,
        MAX_HEIGHT / height
      );

      width = Math.round(
        width * ratio
      );

      height = Math.round(
        height * ratio
      );
    }

    canvas.width = width;
    canvas.height = height;

    // =========================
    // DRAW CROPPED IMAGE
    // =========================

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      width,
      height
    );

    // =========================
    // CONVERT TO FILE
    // =========================

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(
              new Error(
                "Image conversion failed"
              )
            );

            return;
          }

          const file = new File(
            [blob],
            `product-${Date.now()}.jpg`,
            {
              type: "image/jpeg",
            }
          );

          resolve(file);
        },
        "image/jpeg",
        0.9
      );
    });
  };

  // ==================================================
  // CROP DONE
  // ==================================================

  const handleCropSave = async () => {
    if (
      !croppingImage ||
      !croppedAreaPixels ||
      croppingVariantIndex === null
    ) {
      return;
    }

    try {
      // Crop + resize
      const croppedFile =
        await createCroppedImage(
          croppingImage,
          croppedAreaPixels
        );

      setVariants((previous) =>
        previous.map((variant, index) => {
          if (
            index !==
            croppingVariantIndex
          ) {
            return variant;
          }

          const newImages = [
            ...variant.images,
            croppedFile,
          ];

          const newPreviews = [
            ...variant.imagePreviews,
            URL.createObjectURL(
              croppedFile
            ),
          ];

          return {
            ...variant,
            images: newImages,
            imagePreviews: newPreviews,
          };
        })
      );

      // Remove temporary URL
      URL.revokeObjectURL(
        croppingImage
      );

      // Close crop screen
      setCroppingImage(null);

      setCroppingVariantIndex(null);

      setCrop({
        x: 0,
        y: 0,
      });

      setZoom(1);

      setCroppedAreaPixels(null);
    } catch (error) {
      console.error(
        "IMAGE CROP ERROR:",
        error
      );

      alert(
        "Failed to crop image"
      );
    }
  };

  // ==================================================
  // CANCEL CROP
  // ==================================================

  const handleCropCancel = () => {
    if (croppingImage) {
      URL.revokeObjectURL(
        croppingImage
      );
    }

    setCroppingImage(null);

    setCroppingVariantIndex(null);

    setCrop({
      x: 0,
      y: 0,
    });

    setZoom(1);

    setCroppedAreaPixels(null);
  };

  // ==================================================
  // REMOVE IMAGE
  // ==================================================

  const handleRemoveImage = (
    variantIndex,
    imageIndex
  ) => {
    setVariants((previous) =>
      previous.map((variant, index) => {
        if (index !== variantIndex) {
          return variant;
        }

        const newImages =
          variant.images.filter(
            (_, i) =>
              i !== imageIndex
          );

        const newPreviews =
          variant.imagePreviews.filter(
            (_, i) =>
              i !== imageIndex
          );

        return {
          ...variant,
          images: newImages,
          imagePreviews: newPreviews,
        };
      })
    );
  };

  // ==================================================
  // SAVE PRODUCT
  // ==================================================

  const handleSaveProduct = async (e) => {
    e.preventDefault();

    try {
      // ==================================================
      // PRODUCT VALIDATION
      // ==================================================

      if (
        !productData.productName.trim()
      ) {
        alert(
          "Product name is required"
        );

        return;
      }

      if (!productData.category) {
        alert(
          "Please select category"
        );

        return;
      }

      if (!productData.material) {
        alert(
          "Please select material"
        );

        return;
      }

      if (
        !productData.manufacture.trim()
      ) {
        alert(
          "Manufacture is required"
        );

        return;
      }

      // ==================================================
      // VARIANT VALIDATION
      // ==================================================

      for (
        let i = 0;
        i < variants.length;
        i++
      ) {
        const variant =
          variants[i];

        if (
          !variant.variantName.trim()
        ) {
          alert(
            `Variant name is required for Variant ${
              i + 1
            }`
          );

          return;
        }

        if (!variant.skuCode.trim()) {
          alert(
            `SKU code is required for Variant ${
              i + 1
            }`
          );

          return;
        }

        if (!variant.stock) {
          alert(
            `Stock is required for Variant ${
              i + 1
            }`
          );

          return;
        }

        if (!variant.color.trim()) {
          alert(
            `Color is required for Variant ${
              i + 1
            }`
          );

          return;
        }

        if (!variant.size.trim()) {
          alert(
            `Size is required for Variant ${
              i + 1
            }`
          );

          return;
        }

        if (!variant.price) {
          alert(
            `Price is required for Variant ${
              i + 1
            }`
          );

          return;
        }

        // Minimum 3 images
        if (
          variant.images.length < 3
        ) {
          alert(
            `Minimum 3 images are required for Variant ${
              i + 1
            }`
          );

          return;
        }
      }

      // ==================================================
      // CREATE PRODUCT
      // ==================================================

      const productPayload = {
        productName:
          productData.productName,

        categoryId:
          productData.category,

        meterialId:
          productData.material,

        manufacture:
          productData.manufacture,

        status: "active",
      };

      console.log(
        "PRODUCT PAYLOAD:",
        productPayload
      );

      const productResponse =
        await API.post(
          "/product/add",
          productPayload
        );

      console.log(
        "PRODUCT RESPONSE:",
        productResponse.data
      );

      const createdProduct =
        productResponse.data.data;

      if (
        !createdProduct ||
        !createdProduct._id
      ) {
        alert(
          "Product was not created"
        );

        return;
      }

      const productId =
        createdProduct._id;

      console.log(
        "CREATED PRODUCT ID:",
        productId
      );

      // ==================================================
      // CREATE VARIANTS
      // ==================================================

      for (
        const variant of variants
      ) {
        const formData =
          new FormData();

        formData.append(
          "productId",
          productId
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

        // =========================
        // CROPPED + RESIZED IMAGES
        // =========================

        variant.images.forEach(
          (image) => {
            formData.append(
              "images",
              image
            );
          }
        );

        console.log(
          "VARIANT:",
          variant
        );

        await API.post(
          "/productvarient/add",
          formData
        );
      }

      // ==================================================
      // SUCCESS
      // ==================================================

      alert(
        "Product added successfully"
      );

      navigate(
        "/admin/product"
      );
    } catch (error) {
      console.error(
        "ADD PRODUCT ERROR:",
        error.response?.data ||
          error
      );

      alert(
        error.response?.data
          ?.message ||
          "Something went wrong while adding product"
      );
    }
  };

  // ==================================================
  // JSX
  // ==================================================

  return (
    <div className="add-product">

      {/* =========================
          PAGE HEADER
      ========================= */}

      <div className="page-header">

        <h2>
          Add Product
        </h2>

      </div>

      <form
        onSubmit={
          handleSaveProduct
        }
      >

        {/* =========================
            PRODUCT INFORMATION
        ========================= */}

        <div className="product-information">

          <h3>
            Product Information
          </h3>

          {/* PRODUCT NAME */}

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
              placeholder="Enter product name"
            />

          </div>

          {/* CATEGORY */}

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

          {/* MATERIAL */}

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

          {/* MANUFACTURE */}

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
              placeholder="Enter manufacture"
            />

          </div>

        </div>

        {/* =========================
            VARIANTS
        ========================= */}

        <div className="variants-section">

          <h3>
            Product Variants
          </h3>

          {variants.map(
            (variant, index) => (

              <div
                className="variant-card"
                key={index}
              >

                <h4>
                  Variant {index + 1}
                </h4>

                {/* VARIANT NAME */}

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
                    placeholder="Enter variant name"
                  />

                </div>

                {/* SKU */}

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
                    placeholder="Enter SKU code"
                  />

                </div>

                {/* STOCK */}

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
                    placeholder="Enter stock"
                  />

                </div>

                {/* COLOR */}

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
                    placeholder="Enter color"
                  />

                </div>

                {/* SIZE */}

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
                    placeholder="Enter size"
                  />

                </div>

                {/* PRICE */}

                <div className="form-group">

                  <label>
                    Price
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
                    placeholder="Enter price"
                  />

                </div>

                {/* DISCOUNT */}

                <div className="form-group">

                  <label>
                    Discount
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
                    placeholder="Enter discount"
                  />

                </div>

                {/* SHORT DESCRIPTION */}

                <div className="form-group">

                  <label>
                    Short Description
                  </label>

                  <textarea
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
                    placeholder="Enter short description"
                  />

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
                    placeholder="Enter long description"
                  />

                </div>

                {/* =========================
                    IMAGES
                ========================= */}

                <div className="form-group">

                  <label>
                    Product Images
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) =>
                      handleImageChange(
                        index,
                        e
                      )
                    }
                  />

                  <small>
                    Select an image, crop it,
                    then press Done.
                    Minimum 3 and maximum 10
                    images.
                  </small>

                </div>

                {/* =========================
                    IMAGE PREVIEW
                ========================= */}

                {variant
                  .imagePreviews
                  .length > 0 && (

                  <div className="image-preview-container">

                    {variant
                      .imagePreviews
                      .map(
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
                              src={
                                preview
                              }
                              alt={`Preview ${
                                imageIndex + 1
                              }`}
                            />

                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveImage(
                                  index,
                                  imageIndex
                                )
                              }
                            >
                              Remove
                            </button>

                          </div>

                        )
                      )}

                  </div>

                )}

                {/* =========================
                    REMOVE VARIANT
                ========================= */}

                {variants.length >
                  1 && (

                  <button
                    type="button"
                    className="remove-variant-btn"
                    onClick={() =>
                      handleRemoveVariant(
                        index
                      )
                    }
                  >
                    Remove Variant
                  </button>

                )}

              </div>

            )
          )}

          {/* =========================
              ADD VARIANT
          ========================= */}

          <button
            type="button"
            className="add-variant-btn"
            onClick={
              handleAddVariant
            }
          >
            + Add Variant
          </button>

        </div>

        {/* =========================
            FORM ACTIONS
        ========================= */}

        <div className="form-actions">

          <button
            type="submit"
            className="save-btn"
          >
            Save Product
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

      </form>

      {/* ==================================================
          PHONE-STYLE CROP SCREEN
      ================================================== */}

      {croppingImage && (

        <div
          className="crop-modal"
          style={{
            position: "fixed",
            inset: 0,
            background: "#000",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
          }}
        >

          {/* =========================
              CROP AREA
          ========================= */}

          <div
            style={{
              position: "relative",
              flex: 1,
              width: "100%",
            }}
          >

            <Cropper
              image={croppingImage}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="rect"
              showGrid={true}
              onCropChange={
                setCrop
              }
              onZoomChange={
                setZoom
              }
              onCropComplete={
                onCropComplete
              }
            />

          </div>

          {/* =========================
              BOTTOM CONTROLS
          ========================= */}

          <div
            style={{
              background: "#111",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "15px",
            }}
          >

            {/* ZOOM */}

            <input
              type="range"
              min="1"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(e) =>
                setZoom(
                  Number(
                    e.target.value
                  )
                )
              }
            />

            {/* BUTTONS */}

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                gap: "10px",
              }}
            >

              <button
                type="button"
                onClick={
                  handleCropCancel
                }
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleCropSave
                }
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Done
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};

export default AddProduct;