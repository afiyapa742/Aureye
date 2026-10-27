const {gettrack} = require("../repositories/ordertrack");

const GetTrack = async (orderId, itemId) => {
  const result = await gettrack(orderId, itemId);

  if (!result || !result.order || !result.orderItem) {
    throw new Error("Order tracking details not found");
  }

  return result;
};
module.exports = {GetTrack}