const Product = require("../models/product");
const Category = require("../models/category");
const ProductVarient = require("../models/productvarient");
const OrderItem = require("../models/orderitems");

const pagination = require("../utils/pagination");

// ==========================================
// GET ALL PRODUCTS
// ==========================================

const getproduct = async () => {
  return await Product.find()
    .populate("categoryId")
    .lean();
};

// ==========================================
// GET PRODUCT BY ID
// ==========================================

const getproductbyid = async (id) => {
  return await Product.findById(id);
};

// ==========================================
// ADD PRODUCT
// ==========================================

const addproduct = async (productdata) => {
  return await Product.create(productdata);
};

// ==========================================
// UPDATE PRODUCT
// ==========================================

const updateproduct = async (id) => {
  return await Product.findByIdAndUpdate(id);
};

// ==========================================
// UPDATE PRODUCT STATUS
// ==========================================

const statusproduct = async (id, status) => {
  return await Product.findByIdAndUpdate(
    id,
    { status: status },
    { returnDocument: "after" }
  );
};

// ==========================================
// DELETE PRODUCT
// ==========================================

const deleteproduct = async (id) => {
  console.log("REPOSITORY DELETE ID:", id);

  const deletedProduct =
    await Product.findByIdAndDelete(id);

  console.log(
    "MONGODB DELETED PRODUCT:",
    deletedProduct
  );

  return deletedProduct;
};

// ==========================================
// GET PRODUCTS BY CATEGORY
// ==========================================

const getProductsByCategory = async (categoryId) => {
  const category =
    await Category.findById(categoryId);

  const products =
    await Product.find({
      categoryId: categoryId
    }).lean();

  const productsWithVariants =
    await Promise.all(
      products.map(async (p) => {
        const variants =
          await ProductVarient.find({
            productId: p._id
          }).lean();

        return {
          ...p,
          variants
        };
      })
    );

  return {
    category,
    products: productsWithVariants
  };
};

// ==========================================
// SEARCH PRODUCTS
// ==========================================

const searchProducts = async (
  search,
  category
) => {
  const query = {
    productName: {
      $regex: search,
      $options: "i"
    },
    status: "active"
  };

  // If a specific category is selected
  if (
    category &&
    category !== "All"
  ) {
    const categoryData =
      await Category.findOne({
        categoryName: {
          $regex: category,
          $options: "i"
        }
      });

    if (!categoryData) {
      return [];
    }

    query.categoryId =
      categoryData._id;
  }

  const products =
    await Product.find(query).lean();

  const productsWithVariants =
    await Promise.all(
      products.map(async (product) => {
        const variants =
          await ProductVarient.find({
            productId: product._id
          }).lean();

        return {
          ...product,
          variants
        };
      })
    );

  return productsWithVariants;
};

// ==========================================
// GET PRODUCT DETAILS
// ==========================================

const getProductDetails = async (
  productId
) => {
  const product =
    await Product.findById(
      productId
    ).lean();

  if (!product) {
    return null;
  }

  const variants =
    await ProductVarient.find({
      productId: product._id
    }).lean();

  return {
    ...product,
    variants
  };
};

// ==========================================
// GET BEST SELLING PRODUCTS
//
// Based on successfully delivered products
// and total delivered quantity.
// ==========================================

const getBestSellingProducts = async (
  limit = 4
) => {
  // ----------------------------------------
  // Find delivered order items
  // ----------------------------------------

  const bestSellingData =
    await OrderItem.aggregate([
      {
        $match: {
          status: "delivered"
        }
      },

      // --------------------------------------
      // GROUP BY PRODUCT
      // --------------------------------------

      {
        $group: {
          _id: "$productId",

          totalSold: {
            $sum: "$quantity"
          }
        }
      },

      // --------------------------------------
      // HIGHEST SOLD FIRST
      // --------------------------------------

      {
        $sort: {
          totalSold: -1
        }
      },

      // --------------------------------------
      // ONLY TOP PRODUCTS
      // --------------------------------------

      {
        $limit: Number(limit)
      }
    ]);

  // ----------------------------------------
  // No delivered products yet
  // ----------------------------------------

  if (
    !bestSellingData ||
    bestSellingData.length === 0
  ) {
    return [];
  }

  // ----------------------------------------
  // Get product IDs
  // ----------------------------------------

  const productIds =
    bestSellingData.map(
      (item) => item._id
    );

  // ----------------------------------------
  // Fetch products
  // ----------------------------------------

  const products =
    await Product.find({
      _id: {
        $in: productIds
      },
      status: "active"
    }).lean();

  // ----------------------------------------
  // Add variants + totalSold
  // ----------------------------------------

  const productsWithVariants =
    await Promise.all(
      products.map(async (product) => {
        const variants =
          await ProductVarient.find({
            productId: product._id
          }).lean();

        const soldData =
          bestSellingData.find(
            (item) =>
              String(item._id) ===
              String(product._id)
          );

        return {
          ...product,

          variants,

          totalSold:
            soldData?.totalSold || 0
        };
      })
    );

  // ----------------------------------------
  // Keep best-selling order
  // ----------------------------------------

  productsWithVariants.sort(
    (a, b) =>
      b.totalSold - a.totalSold
  );

  return productsWithVariants;
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
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
};