const {
  GetCart,
  AddCart,
  RemoveCart,
  UpdateCart,
} = require("../repositories/cartrepository");

const ProductVarient = require("../models/productvarient");

// ================= GET CART =================

const getcart = async (userId) => {
  const cart = await GetCart({ userId });

  if (!cart) {
    return {
      userId,
      cartitems: [],
    };
  }

  const cartitems = cart.cartitems.map((item) => {
    const variant = item.variantId;

    return {
      variantId: variant?._id,
      productId: variant?.productId?._id,
      quantity: item.quantity,
      stock: variant?.stock ?? 0,
      price: item.price ?? variant?.price ?? 0,
      productName:
        variant?.productId?.productName || "Product",
      image: variant?.productImages?.[0]?.imageUrl || "",
      outOfStock: !variant || variant.stock <= 0,
      exceedsStock:
        !variant || item.quantity > variant.stock,
    };
  });

  return {
    userId: cart.userId,
    cartitems,
  };
};

// ================= STOCK VALIDATION =================

const validateStock = async (variantId, quantity) => {
  const qty = Number(quantity);

  if (!Number.isInteger(qty) || qty < 1) {
    throw new Error("Quantity must be at least 1");
  }

  const variant = await ProductVarient.findById(variantId);

  if (!variant) {
    throw new Error("Product variant not found");
  }

  if (variant.stock <= 0) {
    throw new Error("Product is out of stock");
  }

  if (qty > variant.stock) {
    throw new Error(
      `Only ${variant.stock} items are available`
    );
  }

  return { qty, variant };
};

// ================= ADD CART =================

const createcart = async (
  userId,
  variantId,
  quantity,
  price
) => {
  const { qty, variant } = await validateStock(
    variantId,
    quantity
  );

  const existingCart = await GetCart({ userId });

  const existingItem = existingCart?.cartitems?.find(
    (item) =>
      String(item.variantId?._id || item.variantId) ===
      String(variantId)
  );

  const existingQty = existingItem?.quantity || 0;

  if (existingQty + qty > variant.stock) {
    throw new Error(
      `Only ${variant.stock} items are available. You already have ${existingQty} in your cart.`
    );
  }

  const cart = await AddCart(
    userId,
    variantId,
    qty,
    price
  );

  if (!cart) {
    throw new Error("Unable to add product to cart");
  }

  return cart;
};

// ================= DELETE CART =================

const deletecart = async (userId, variantId) => {
  const cart = await RemoveCart(userId, variantId);

  if (!cart) {
    throw new Error("Unable to remove product from cart");
  }

  return cart;
};

// ================= UPDATE CART =================

const updateCart = async (
  userId,
  variantId,
  quantity
) => {
  const { qty } = await validateStock(
    variantId,
    quantity
  );

  const cart = await UpdateCart(
    variantId,
    userId,
    qty
  );

  if (!cart) {
    throw new Error("Unable to update cart");
  }

  return cart;
};

// ================= EXPORT =================

module.exports = {
  getcart,
  createcart,
  deletecart,
  updateCart,
};