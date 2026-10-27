const express = require("express");

const router = express.Router();

const {
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
} = require("../controllers/product");


// ==========================================
// GET ALL PRODUCTS
// ==========================================

router.get(
  "/",
  GetProduct
);


// ==========================================
// HOME
// ==========================================

router.get(
  "/home",
  GetProduct
);


// ==========================================
// BEST SELLERS
// Products with highest delivered quantity
// ==========================================

router.get(
  "/bestsellers",
  GetBestSellers
);


// ==========================================
// SEARCH
// ==========================================

router.get(
  "/search",
  SearchProduct
);


// ==========================================
// GET PRODUCTS BY CATEGORY
// IMPORTANT: BEFORE /:id
// ==========================================

router.get(
  "/category/product/:categoryId",
  getcategoryById
);


// ==========================================
// PRODUCT DETAILS
// IMPORTANT: BEFORE /:id
// ==========================================

router.get(
  "/details/:productId",
  getProductDetails
);


// ==========================================
// GET PRODUCT BY ID
// IMPORTANT: AFTER ALL SPECIFIC GET ROUTES
// ==========================================

router.get(
  "/:id",
  GetProductById
);


// ==========================================
// ADD PRODUCT
// ==========================================

router.post(
  "/add",
  AddProduct
);


// ==========================================
// UPDATE STATUS
// ==========================================

router.put(
  "/status/:id",
  StatusProduct
);


// ==========================================
// EDIT PRODUCT
// ==========================================

router.put(
  "/edit/:id",
  UpdateProduct
);


// ==========================================
// DELETE PRODUCT
// ==========================================

router.delete(
  "/delete/:id",
  DeleteProduct
);


// ==========================================
// UPDATE PRODUCT
// ==========================================

router.put(
  "/update/:id",
  UpdateProduct
);


module.exports = router;