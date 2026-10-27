const {
  getAllOrders,
  getvieworder,
  updateOrderItemStatus,
  updateDeliveryDate,
} = require("../repositories/adminorder");

// ==========================================
// GET ALL ORDERS
// ==========================================

const GetAllOrders = async () => {
  const orders = await getAllOrders();
  return orders;
};

// ==========================================
// GET ORDER DETAILS
// ==========================================

const GetViewOrder = async (orderId) => {
  if (!orderId) {
    throw new Error("Order ID is required");
  }

  const orderDetails = await getvieworder(orderId);

  if (!orderDetails) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  return orderDetails;
};

// ==========================================
// UPDATE ORDER ITEM STATUS
// ==========================================

const UpdateOrderItemStatus = async (
  orderId,
  itemId,
  status
) => {
  if (!orderId) {
    throw new Error("Order ID is required");
  }

  if (!itemId) {
    throw new Error("Item ID is required");
  }

  if (!status) {
    throw new Error("Status is required");
  }

  return await updateOrderItemStatus(
    orderId,
    itemId,
    status
  );
};

// ==========================================
// UPDATE DELIVERY DATE
// ==========================================

const UpdateDeliveryDate = async (
  orderId,
  deliverydate
) => {
  if (!orderId) {
    throw new Error("Order ID is required");
  }

  if (!deliverydate) {
    throw new Error("Delivery date is required");
  }

  return await updateDeliveryDate(
    orderId,
    deliverydate
  );
};

// ==========================================
// EXPORT SERVICES
// ==========================================

module.exports = {
  GetAllOrders,
  GetViewOrder,
  UpdateOrderItemStatus,
  UpdateDeliveryDate,
};