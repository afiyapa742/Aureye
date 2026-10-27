const {
  getproduct,
  addproduct,
  updateproduct,
  statusproduct,
  deleteproduct,
  getproductbyid,
  getProductsByCategory,
  searchProducts,
  getProductDetails,
  getBestSellingProducts
} = require("../repositories/product");

// ==========================================
// GET ALL PRODUCTS
// ==========================================

const getProduct = async () => {
  const product =
    await getproduct();

  if (!product) {
    throw new Error(
      "something wrong"
    );
  }

  return product;
};

// ==========================================
// GET PRODUCT BY ID
// ==========================================

const getProductById = async (id) => {
  const product =
    await getproductbyid(id);

  if (!product) {
    throw new Error(
      "Product not found"
    );
  }

  return product;
};

// ==========================================
// ADD PRODUCT
// ==========================================

const addProduct = async (updata) => {
  const product =
    await addproduct(updata);

  if (!product) {
    throw new Error(
      "the product not added"
    );
  }

  return product;
};

// ==========================================
// UPDATE PRODUCT
// ==========================================

const updateProduct = async (
  id,
  update
) => {
  const product =
    await updateproduct(
      id,
      update
    );

  if (!product) {
    throw new Error(
      "Product not updated"
    );
  }

  return product;
};

// ==========================================
// UPDATE PRODUCT STATUS
// ==========================================

const statusProduct = async (
  id,
  status
) => {
  const product =
    await statusproduct(
      id,
      status
    );

  if (!product) {
    throw new Error(
      "Product status not updated"
    );
  }

  return product;
};

// ==========================================
// DELETE PRODUCT
// ==========================================

const deleteProduct = async (id) => {
  console.log(
    "SERVICE DELETE ID:",
    id
  );

  const product =
    await deleteproduct(id);

  console.log(
    "SERVICE DELETE RESULT:",
    product
  );

  if (!product) {
    throw new Error(
      "Product not deleted"
    );
  }

  return product;
};

// ==========================================
// GET PRODUCTS BY CATEGORY
// ==========================================

const getproductsbycategory =
  async (categoryId) => {
    const product =
      await getProductsByCategory(
        categoryId
      );

    if (!product) {
      throw new Error(
        "something went wrong"
      );
    }

    return product;
  };

// ==========================================
// SEARCH PRODUCT
// ==========================================

const searchProduct = async (
  search,
  category
) => {
  const products =
    await searchProducts(
      search,
      category
    );

  return products;
};

// ==========================================
// PRODUCT DETAILS
// ==========================================

const fetchproductdetails =
  async (productId) => {
    const product =
      await getProductDetails(
        productId
      );

    if (!product) {
      throw new Error(
        "something wentwrong"
      );
    }

    return product;
  };

// ==========================================
// BEST SELLING PRODUCTS
// ==========================================

const getBestSellers = async () => {
  const products =
    await getBestSellingProducts(4);

  return products;
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
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
};