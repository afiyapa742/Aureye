const Wishlist = require("../models/wishlist");


// ==========================================
// GET WISHLIST
// ==========================================

const getWishlist = async (userId) => {

  console.log("GET WISHLIST USER ID:", userId);

  const wishlist = await Wishlist.findOne({ userId })
    .populate({
      path: "items.variantId",
      model: "ProductVarient",
      populate: {
        path: "productId",
        model: "Product"
      }
    });

  console.log("GET WISHLIST RESULT:", wishlist);

  return wishlist;
};


// ==========================================
// FIND WISHLIST ITEM
// ==========================================

const findWishlistItem = async (userId, variantId) => {

  return await Wishlist.findOne({
    userId,
    "items.variantId": variantId
  });

};


// ==========================================
// ADD TO WISHLIST
// ==========================================

const Addwishlist = async (userId, variantId) => {

  return await Wishlist.findOneAndUpdate(

    { userId },

    {
      $push: {
        items: {
          variantId,
          addedAt: new Date()
        }
      }
    },

    {
      returnDocument: "after",
      upsert: true
    }

  );

};


// ==========================================
// REMOVE FROM WISHLIST
// ==========================================

const Removewishlist = async (userId, variantId) => {

  return await Wishlist.findOneAndUpdate(

    { userId },

    {
      $pull: {
        items: {
          variantId
        }
      }
    },

    {
      returnDocument: "after"
    }

  );

};


module.exports = {

  getWishlist,
  findWishlistItem,
  Addwishlist,
  Removewishlist

};