const { getstock } = require("../repositories/admininventory");

const GetStock = async () => {
  const stock = await getstock();

  if (!stock || stock.length === 0) {
    throw new Error("Inventory not found");
  }

  return stock;
};

module.exports = {
  GetStock,
};