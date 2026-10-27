const express = require("express");

const {
  getwishlist,
  findwishlist,
  addwishlist,
  removewishlistitem
} = require("../controllers/wishlist");

const protect = require("../auth/authMiddleware");

const router = express.Router();


// GET COMPLETE WISHLIST
router.get(
  "/",
  protect,
  getwishlist
);


// FIND WISHLIST ITEM
router.get(
  "/item/:variantId",
  protect,
  findwishlist
);


// ADD TO WISHLIST
router.post(
  "/",
  protect,
  addwishlist
);


// REMOVE FROM WISHLIST
router.delete(
  "/:variantId",
  protect,
  removewishlistitem
);


module.exports = router;