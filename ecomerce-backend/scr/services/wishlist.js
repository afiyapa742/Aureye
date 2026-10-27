const {
  getWishlist,
  findWishlistItem,
  Addwishlist,
  Removewishlist
} = require("../repositories/wishlistrepo");


// GET COMPLETE WISHLIST
const Getwish = async (userId) => {

  const wishlist = await getWishlist(userId);

  if (!wishlist) {
    return {
      userId,
      items: []
    };
  }

  return wishlist;
};


// FIND ONE WISHLIST ITEM
const findwishlistitem = async (userId, variantId) => {

  const item = await findWishlistItem(userId, variantId);

  if (!item) {
    throw new Error("Product not found in wishlist");
  }

  return item;
};


// ADD TO WISHLIST
const additems = async (userId, variantId) => {

  const existingItem = await findWishlistItem(userId, variantId);

  if (existingItem) {
    throw new Error("Product already exists in wishlist");
  }

  const wishlist = await Addwishlist(userId, variantId);

  if (!wishlist) {
    throw new Error("Failed to add item to wishlist");
  }

  return wishlist;
};


// REMOVE FROM WISHLIST
const removewishlist = async (userId, variantId) => {

  const existproduct = await findWishlistItem(userId, variantId);

  if (!existproduct) {
    throw new Error("Product not found in wishlist");
  }

  const wishlist = await Removewishlist(userId, variantId);

  if (!wishlist) {
    throw new Error("Failed to remove item from wishlist");
  }

  return wishlist;
};


module.exports = {
  Getwish,
  findwishlistitem,
  additems,
  removewishlist
};