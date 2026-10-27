const {
  getProduct,
  addProduct,
  updateProduct,
  statusProduct,
  deleteProduct,
  getProductById,
  getproductsbycategory,
  searchProduct,
  fetchproductdetails,
  getBestSellers
} = require("../services/product");

// ==========================================
// GET ALL PRODUCTS
// ==========================================

const GetProduct = async (
  req,
  res
) => {
  try {
    const product =
      await getProduct();

    return res.status(200).json({
      message:
        "Product fetched successfully",
      data: product
    });

  } catch (error) {
    console.error(
      "GET PRODUCT ERROR:",
      error
    );

    return res.status(400).json({
      message: error.message
    });
  }
};

// ==========================================
// ADD PRODUCT
// ==========================================

const AddProduct = async (
  req,
  res
) => {
  try {
    const productdata =
      req.body;

    const product =
      await addProduct(
        productdata
      );

    return res.status(201).json({
      message:
        "Product added successfully",
      data: product
    });

  } catch (error) {
    console.error(
      "ADD PRODUCT ERROR:",
      error
    );

    return res.status(400).json({
      message: error.message
    });
  }
};

// ==========================================
// UPDATE PRODUCT
// ==========================================

const UpdateProduct = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    const update =
      req.body;

    const product =
      await updateProduct(
        id,
        update
      );

    return res.status(200).json({
      message:
        "Product updated successfully",
      data: product
    });

  } catch (error) {
    console.error(
      "UPDATE PRODUCT ERROR:",
      error
    );

    return res.status(400).json({
      message: error.message
    });
  }
};

// ==========================================
// STATUS PRODUCT
// ==========================================

const StatusProduct = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    const { status } =
      req.body;

    const product =
      await statusProduct(
        id,
        status
      );

    return res.status(200).json({
      message:
        "Product status updated successfully",
      data: product
    });

  } catch (error) {
    console.error(
      "STATUS PRODUCT ERROR:",
      error
    );

    return res.status(400).json({
      message: error.message
    });
  }
};

// ==========================================
// DELETE PRODUCT
// ==========================================

const DeleteProduct = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    console.log(
      "DELETE PRODUCT ID:",
      id
    );

    const product =
      await deleteProduct(id);

    return res.status(200).json({
      message:
        "Product deleted successfully",
      data: product
    });

  } catch (error) {
    console.error(
      "DELETE PRODUCT ERROR:",
      error
    );

    return res.status(400).json({
      message: error.message
    });
  }
};

// ==========================================
// GET PRODUCT BY ID
// ==========================================

const GetProductById = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    const product =
      await getProductById(id);

    return res.status(200).json({
      message:
        "Product fetched successfully",
      data: product
    });

  } catch (error) {
    console.error(
      "GET PRODUCT BY ID ERROR:",
      error
    );

    return res.status(400).json({
      message: error.message
    });
  }
};

// ==========================================
// GET PRODUCTS BY CATEGORY
// ==========================================

const getcategoryById = async (
  req,
  res
) => {
  try {
    const { categoryId } =
      req.params;

    const product =
      await getproductsbycategory(
        categoryId
      );

    return res.status(200).json(
      product
    );

  } catch (error) {
    return res.status(400).json({
      message: error.message
    });
  }
};

// ==========================================
// SEARCH PRODUCTS
// ==========================================

const SearchProduct = async (
  req,
  res
) => {
  try {
    const {
      search,
      category
    } = req.query;

    if (
      !search ||
      !search.trim()
    ) {
      return res.status(400).json({
        message:
          "Search text is required"
      });
    }

    const products =
      await searchProduct(
        search.trim(),
        category
      );

    return res.status(200).json({
      message:
        "Products searched successfully",
      data: products
    });

  } catch (error) {
    console.error(
      "SEARCH PRODUCT ERROR:",
      error
    );

    return res.status(400).json({
      message: error.message
    });
  }
};

// ==========================================
// GET PRODUCT DETAILS
// ==========================================

const getProductDetails = async (
  req,
  res
) => {
  try {
    const { productId } =
      req.params;

    const product =
      await fetchproductdetails(
        productId
      );

    if (!product) {
      return res.status(404).json({
        message:
          "Product not found"
      });
    }

    return res.status(200).json({
      message:
        "Product details fetched successfully",
      product
    });

  } catch (error) {
    return res.status(400).json({
      message: error.message
    });
  }
};

// ==========================================
// GET BEST SELLING PRODUCTS
// ==========================================

const GetBestSellers = async (
  req,
  res
) => {
  try {
    const products =
      await getBestSellers();

    return res.status(200).json({
      success: true,
      message:
        "Best selling products fetched successfully",
      data: products
    });

  } catch (error) {
    console.error(
      "BEST SELLERS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch best selling products"
    });
  }
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  AddProduct,
  UpdateProduct,
  StatusProduct,
  DeleteProduct,
  GetProduct,
  GetProductById,
  getcategoryById,
  SearchProduct,
  getProductDetails,
  GetBestSellers
};