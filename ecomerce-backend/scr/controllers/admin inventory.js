const { GetStock } = require("../services/admininventory");

const getStock = async (
  req,
  res
) => {
  try {
    const inventory =
      await GetStock();

    return res.status(200).json({
      message:
        "Inventory fetched successfully",
      data: inventory,
    });
  } catch (error) {
    console.error(
      "GET INVENTORY CONTROLLER ERROR:",
      error
    );

    return res.status(500).json({
      message:
        error.message ||
        "Unable to fetch inventory",
    });
  }
};

module.exports = {
  getStock,
};