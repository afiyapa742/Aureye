const {
  Getwish,
  findwishlistitem,
  additems,
  removewishlist
} = require("../services/wishlist");


// ==========================================
// GET COMPLETE WISHLIST
// ==========================================

const getwishlist = async (req, res) => {

  try {

    const userId = req.user.id;

    const wishlist = await Getwish(userId);

    res.status(200).json({
      success: true,
      message: "Wishlist fetched successfully",
      wishlist
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};


// ==========================================
// FIND WISHLIST ITEM
// ==========================================

const findwishlist = async (req, res) => {

  try {

    const userId = req.user.id;

    const { variantId } = req.params;

    if (!variantId) {
      return res.status(400).json({
        success: false,
        message: "Variant ID is required"
      });
    }

    const item = await findwishlistitem(userId, variantId);

    res.status(200).json({
      success: true,
      message: "Wishlist item found",
      item
    });

  } catch (error) {

    res.status(404).json({
      success: false,
      message: error.message
    });

  }
};


// ==========================================
// ADD TO WISHLIST
// ==========================================

const addwishlist = async (req, res) => {

  try {

    const userId = req.user.id;

    const { variantId } = req.body;

    if (!variantId) {
      return res.status(400).json({
        success: false,
        message: "Variant ID is required"
      });
    }

    const wishlist = await additems(userId, variantId);

    res.status(201).json({
      success: true,
      message: "Product added to wishlist",
      wishlist
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};


// ==========================================
// REMOVE FROM WISHLIST
// ==========================================

const removewishlistitem = async (req, res) => {

  try {

    const userId = req.user.id;

    const { variantId } = req.params;

    if (!variantId) {
      return res.status(400).json({
        success: false,
        message: "Variant ID is required"
      });
    }

    const wishlist = await removewishlist(userId, variantId);

    res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
      wishlist
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};


module.exports = {
  getwishlist,
  findwishlist,
  addwishlist,
  removewishlistitem
};