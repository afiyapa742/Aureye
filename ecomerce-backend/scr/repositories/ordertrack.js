const Order = require("../models/order");
const OrderItem = require("../models/orderitems");

const gettrack = async (orderId, itemId) => {
  const order = await Order.findById(orderId);

  const orderItem = await OrderItem.findOne({
    _id: itemId,
    orderId: orderId,
  })
    .populate("productId")
    .populate("variantId");

  return {
    order,
    orderItem,
  };
};

module.exports = {
  gettrack,
};