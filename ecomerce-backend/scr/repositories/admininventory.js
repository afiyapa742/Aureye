const ProductVarient = require("../models/productvarient");

const getstock = async () => {
  try {
    const inventory = await ProductVarient.find({})
      .populate({
        path: "productId",
        model: "Product",
        select: "productName categoryId",
      })
      .lean();

    return inventory;
  } catch (error) {
    console.error(
      "GET STOCK REPOSITORY ERROR:",
      error
    );

    throw error;
  }
};



module.exports = {
  getstock,
};