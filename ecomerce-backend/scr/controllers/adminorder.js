const {
  GetAllOrders,GetViewOrder,UpdateOrderItemStatus,
    UpdateDeliveryDate
} = require("../services/adminorder");

const getAllOrders = async (
  req,
  res
) => {
  try {
    const orders =
      await GetAllOrders();

    return res.status(200).json({
      message:
        "Orders fetched successfully",
      data: orders,
    });
  } catch (error) {
    console.error(
      "GET ALL ORDERS CONTROLLER ERROR:",
      error
    );

    return res.status(500).json({
      message:
        error.message ||
        "Unable to fetch orders",
    });
  }
};
const getViewOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const data = await GetViewOrder(orderId);

    return res.status(200).json({
      message: "Order details fetched successfully",
      data,
    });
  } catch (error) {
    console.error("GET VIEW ORDER CONTROLLER ERROR:", error);

    const statusCode =
      error.statusCode ||
      (error.name === "CastError" || error.name === "BSONError"
        ? 400
        : error.message === "Order not found"
        ? 404
        : 500);

    return res.status(statusCode).json({
      message: error.message || "Unable to load order details",
    });
  }
};
const updateOrderItemStatus =
  async (req, res) => {
    try {
      const {
        orderId,
        itemId,
      } = req.params;

      const {
        status,
      } = req.body;

      const item =
        await UpdateOrderItemStatus(
          orderId,
          itemId,
          status
        );

      return res.status(200).json({
        message:
          "Order item status updated successfully",
        data: item,
      });
    } catch (error) {
      console.error(
        "UPDATE ORDER ITEM STATUS CONTROLLER ERROR:",
        error
      );

      return res.status(400).json({
        message:
          error.message ||
          "Unable to update order item status",
      });
    }
  };

/* ==========================================
   UPDATE DELIVERY DATE
========================================== */

const updateDeliveryDate =
  async (req, res) => {
    try {
      const { orderId } =
        req.params;

      const {
        deliverydate,
      } = req.body;

      const order =
        await UpdateDeliveryDate(
          orderId,
          deliverydate
        );

      return res.status(200).json({
        message:
          "Delivery date updated successfully",
        data: order,
      });
    } catch (error) {
      console.error(
        "UPDATE DELIVERY DATE CONTROLLER ERROR:",
        error
      );

      return res.status(400).json({
        message:
          error.message ||
          "Unable to update delivery date",
      });
    }
  };
  

module.exports = {
  getAllOrders,
  getViewOrder,
  updateOrderItemStatus,
  updateDeliveryDate
};