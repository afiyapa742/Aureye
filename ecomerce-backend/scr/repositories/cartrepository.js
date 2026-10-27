const Cart = require("../models/cart");

const GetCart = async (data) => {
  return await Cart.findOne(data)
    .populate({
      path: "cartitems.variantId",
      model: "ProductVarient",
      populate: {
        path: "productId",
        model: "Product",
      },
    });
};


const AddCart = async (
  userId,
  variantId,
  quantity,
  price
) => {

  let cart = await Cart.findOne({ userId });

  // If user doesn't have a cart, create one
  if (!cart) {
    return await Cart.create({
      userId,
      cartitems: [
        {
          variantId,
          price,
          quantity,
        },
      ],
    });
  }

  // Check whether this variant is already in cart
  const existingItem = cart.cartitems.find(
    (item) =>
      item.variantId.toString() ===
      variantId.toString()
  );

  if (existingItem) {
    existingItem.quantity += quantity;

    // Update to the latest selling price
    existingItem.price = price;
  } else {
    cart.cartitems.push({
      variantId,
      price,
      quantity,
    });
  }

  return await cart.save();
};


const RemoveCart = async (
  userId,
  variantId
) => {
  return await Cart.findOneAndUpdate(
    { userId },
    {
      $pull: {
        cartitems: {
          variantId,
        },
      },
    },
    { new: true }
  );
};


const UpdateCart = async (
  variantId,
  userId,
  quantity
) => {
  return await Cart.findOneAndUpdate(
    {
      userId,
      "cartitems.variantId": variantId,
    },
    {
      $set: {
        "cartitems.$.quantity": quantity,
      },
    },
    {
      returnDocument: "after",
      runValidators: true,
    }
  );
};


module.exports = {
  GetCart,
  AddCart,
  RemoveCart,
  UpdateCart,
};