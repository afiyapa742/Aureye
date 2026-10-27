const {
  getcart,
  createcart,
  deletecart,
  updateCart,
} = require("../services/cart");

// Adjust this path/name to your variant model.
const Variant = require("../models/productvarient");

const MAX_QTY_PER_PRODUCT = 3;


// ================= HELPERS =================

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getVariantStock = async (variantId) => {
  const variant = await Variant.findById(variantId).select("stock");

  if (!variant) return null;

  return Number(variant.stock || 0);
};

const assertQuantityAllowed = (quantity, stock) => {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw createError("Quantity must be at least 1");
  }

  if (stock < 1) {
    throw createError("This product is out of stock");
  }

  if (quantity > MAX_QTY_PER_PRODUCT) {
    throw createError(
      `You can buy a maximum of ${MAX_QTY_PER_PRODUCT} per product`
    );
  }

  if (quantity > stock) {
    throw createError(`Only ${stock} available in stock`);
  }
};

const getItemVariantId = (item) =>
  String(item?.variantId?._id || item?.variantId || "");


// ================= GET CART =================

const GetCart = async (req, res) => {
  try {

    const userId = req.user.id;

    const cart = await getcart(userId);

    let cartData = cart;

    // Attach stock + maxQty to every cart item.
    if (cart) {
      const plainCart =
        typeof cart.toObject === "function" ? cart.toObject() : cart;

      if (Array.isArray(plainCart.cartitems)) {
        const cartitems = await Promise.all(
          plainCart.cartitems.map(async (item) => {
            const stock =
              (await getVariantStock(getItemVariantId(item))) ?? 0;

            return {
              ...item,
              stock,
              maxQty: Math.min(MAX_QTY_PER_PRODUCT, stock),
            };
          })
        );

        cartData = { ...plainCart, cartitems };
      }
    }

    return res.status(200).json({
      success: true,
      message: "Cart fetched successfully",
      data: cartData,
    });

  } catch (error) {

    console.log("GET CART ERROR:", error);

    return res.status(
      error.statusCode || 500
    ).json({
      success: false,
      message: error.message,
    });

  }
};


// ================= ADD TO CART =================

const AddCart = async (req, res) => {
  try {

    const userId = req.user.id;

    const {
      variantId,
      quantity,
      price,
    } = req.body;

    const stock = await getVariantStock(variantId);

    if (stock === null) {
      throw createError("Product variant not found", 404);
    }

    // Quantity already in the cart counts toward the limit.
    const existingCart = await getcart(userId);

    const existingItem = (existingCart?.cartitems || []).find(
      (item) => getItemVariantId(item) === String(variantId)
    );

    const existingQuantity = Number(existingItem?.quantity || 0);
    const newTotal = existingQuantity + Number(quantity || 1);

    try {
      assertQuantityAllowed(newTotal, stock);
    } catch (limitError) {
      if (existingQuantity > 0) {
        limitError.message = `${limitError.message} (you already have ${existingQuantity} in your cart)`;
      }

      throw limitError;
    }

    const cart = await createcart(
      userId,
      variantId,
      quantity,
      price
    );

    return res.status(201).json({
      success: true,
      message:
        "Product added to cart successfully",
      data: cart,
    });

  } catch (error) {

    return res.status(
      error.statusCode || 500
    ).json({
      success: false,
      message: error.message,
    });

  }
};


// ================= REMOVE FROM CART =================

const RemoveCart = async (req, res) => {
  try {

    const userId = req.user.id;

    const {
      variantId,
    } = req.params;

    const cart = await deletecart(
      userId,
      variantId
    );

    return res.status(200).json({
      success: true,
      message:
        "Product removed from cart successfully",
      data: cart,
    });

  } catch (error) {

    return res.status(
      error.statusCode || 500
    ).json({
      success: false,
      message: error.message,
    });

  }
};


// ================= UPDATE CART =================

const UpdateCart = async (req, res) => {
  try {

    const userId = req.user.id;

    const {
      variantId,
      quantity,
    } = req.body;

    const stock = await getVariantStock(variantId);

    if (stock === null) {
      throw createError("Product variant not found", 404);
    }

    assertQuantityAllowed(Number(quantity), stock);

    const cart = await updateCart(
      userId,
      variantId,
      quantity
    );

    return res.status(200).json({
      success: true,
      message:
        "Cart updated successfully",
      data: cart,
    });

  } catch (error) {

    return res.status(
      error.statusCode || 500
    ).json({
      success: false,
      message: error.message,
    });

  }
};


module.exports = {
  GetCart,
  AddCart,
  RemoveCart,
  UpdateCart,
};