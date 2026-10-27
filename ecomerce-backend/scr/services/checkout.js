
const mongoose = require("mongoose");
const ProductVarient = require("../models/productvarient");

const {
  createOrder,
  createOrderItem,
  createPayment,
  getOrderById,
  getOrderItems,
  getPaymentByOrderId,
  updateOrderStatus,
  updatePaymentStatus,
} = require("../repositories/checkout");

// ==========================================
// HELPERS
// ==========================================

const roundToTwo = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const getObjectId = (value) => {
  if (!value) return null;

  // Handles populated documents and objects containing _id.
  if (typeof value === "object" && value._id) {
    return value._id;
  }

  return value;
};

const resolveProductId = (item, variant) => {
  // Prefer product information already provided by the checkout item.
  const possibleProductIds = [
    item.productId,
    item.product,
    variant.productId,
    variant.product,
    variant.productID,
  ];

  for (const candidate of possibleProductIds) {
    const productId = getObjectId(candidate);

    if (
      productId &&
      mongoose.Types.ObjectId.isValid(String(productId))
    ) {
      return new mongoose.Types.ObjectId(String(productId));
    }
  }

  return null;
};

// ==========================================
// CREATE NEW ORDER
// ==========================================

const createNewOrder = async (orderData, orderItems) => {
  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    throw new Error("Order must contain at least one item");
  }

  if (!orderData) {
    throw new Error("Order data is required");
  }

  // Validate variant IDs and quantities before changing stock.
  const stockRequirements = new Map();

  for (const item of orderItems) {
    if (
      !item.variantId ||
      !mongoose.Types.ObjectId.isValid(String(item.variantId))
    ) {
      throw new Error("Invalid or missing variantId in order item");
    }

    const quantity = Number(item.quantity);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error("Order item quantity must be a positive integer");
    }

    const variantId = String(item.variantId);

    stockRequirements.set(
      variantId,
      (stockRequirements.get(variantId) || 0) + quantity
    );
  }

  const reservedVariants = [];
  let createdOrderId = null;

  try {
    // ==========================================
    // RESERVE STOCK
    // ==========================================

    for (const [variantId, quantity] of stockRequirements) {
      const variant = await ProductVarient.findOneAndUpdate(
        {
          _id: variantId,
          stock: { $gte: quantity },
        },
        {
          $inc: { stock: -quantity },
        },
        {
          returnDocument: "after",
        }
      );

      if (!variant) {
        const existingVariant =
          await ProductVarient.findById(variantId).lean();

        if (!existingVariant) {
          throw new Error(`Product variant not found: ${variantId}`);
        }

        throw new Error(
          `Insufficient stock. Available: ${existingVariant.stock}, requested: ${quantity}`
        );
      }

      reservedVariants.push({
        variantId,
        quantity,
      });
    }

    // ==========================================
    // CREATE ORDER
    // ==========================================
const paymentMethod = String(
  orderData.paymentmethod || ""
).toUpperCase();

if (!["COD", "ONLINE", "WALLET"].includes(paymentMethod)) {
  throw new Error("Invalid payment method");
}

// ==========================================
// CREATE ORDER
// ==========================================

// Never trust payment status supplied by the frontend.
const initialPaymentStatus = "pending";

const order = await createOrder({
  ...orderData,
  paymentmethod: paymentMethod,
  paymentstatus: initialPaymentStatus,
  orderstatus: "pending",
});

if (!order || !order._id) {
  throw new Error("Failed to create order");
}

createdOrderId = order._id;
    // ==========================================
    // CALCULATE SUBTOTAL AND COUPON DISCOUNT
    // ==========================================

    const itemSubtotal = orderItems.reduce((total, item) => {
      const price = Number(item.price);
      const quantity = Number(item.quantity);

      if (!Number.isFinite(price) || price < 0) {
        throw new Error("Invalid price in order item");
      }

      return total + price * quantity;
    }, 0);

    const couponDiscount = Math.max(
      0,
      Number(orderData.coupondiscount || 0)
    );

    if (!Number.isFinite(couponDiscount)) {
      throw new Error("Invalid coupon discount");
    }

    const createdItems = [];

    // ==========================================
    // CREATE ORDER ITEMS
    // ==========================================

    for (const item of orderItems) {
      const variantId = new mongoose.Types.ObjectId(
        String(item.variantId)
      );

      const variant = await ProductVarient.findById(variantId);

      if (!variant) {
        throw new Error(`Product variant not found: ${variantId}`);
      }

      // Resolve the actual product reference.
      const productId = resolveProductId(item, variant);

      if (!productId) {
        throw new Error(
          `Product ID is missing for variant ${variantId}. ` +
          "Check the product reference field in models/productvarient.js."
        );
      }

      const price = Number(item.price);
      const quantity = Number(item.quantity);
      const lineAmount = roundToTwo(price * quantity);

      let itemCouponDiscount = 0;

      if (itemSubtotal > 0 && couponDiscount > 0) {
        itemCouponDiscount =
          (lineAmount / itemSubtotal) * couponDiscount;
      }

      const paidAmount = roundToTwo(
        Math.max(0, lineAmount - itemCouponDiscount)
      );

const isCOD = paymentMethod === "COD";

const orderItemData = {
  orderId: order._id,
  productId,
  variantId,
  quantity,
  price,
  paidAmount,
  refundAmount: paidAmount,
  status: isCOD ? "confirmed" : "pending",
};

const createdItem = await createOrderItem(orderItemData);

if (!createdItem) {
  throw new Error("Failed to create order item");
}

createdItems.push(createdItem);
    }

    

    // ==========================================
    // CREATE PAYMENT
    // ==========================================

// ==========================================
// CREATE PAYMENT
// ==========================================

const payment = await createPayment({
  orderId: order._id,
  paymentMethod,
  amount: Number(orderData.total),
  paymentStatus: "pending",
});

if (!payment) {
  throw new Error("Failed to create payment");
}


    return {
      order,
      items: createdItems,
      payment,
    };
  } catch (error) {
    // ==========================================
    // RESTORE RESERVED STOCK
    // ==========================================

    for (const reserved of reservedVariants.reverse()) {
      try {
        await ProductVarient.updateOne(
          { _id: reserved.variantId },
          { $inc: { stock: reserved.quantity } }
        );
      } catch (restoreError) {
        console.error(
          "Failed to restore stock for variant:",
          reserved.variantId,
          restoreError.message
        );
      }
    }

    // Remove the incomplete order if one was created.
    // Order-item/payment cleanup may also be needed if later
    // operations partially succeeded.
    if (createdOrderId) {
      try {
        const Order = require("../models/order");
        await Order.deleteOne({ _id: createdOrderId });
      } catch (cleanupError) {
        console.error(
          "Failed to clean up incomplete order:",
          cleanupError.message
        );
      }
    }

    throw error;
  }
};

// ==========================================
// GET ORDER BY ID
// ==========================================

const getOrderDetails = async (orderId) => {
  if (!mongoose.Types.ObjectId.isValid(String(orderId))) {
    throw new Error("Invalid order ID");
  }

  return await getOrderById(orderId);
};

// ==========================================
// GET ORDER ITEMS
// ==========================================

const getOrderItemDetails = async (orderId) => {
  if (!mongoose.Types.ObjectId.isValid(String(orderId))) {
    throw new Error("Invalid order ID");
  }

  return await getOrderItems(orderId);
};

// ==========================================
// GET PAYMENT BY ORDER ID
// ==========================================

const getPaymentDetails = async (orderId) => {
  if (!mongoose.Types.ObjectId.isValid(String(orderId))) {
    throw new Error("Invalid order ID");
  }

  return await getPaymentByOrderId(orderId);
};

// ==========================================
// UPDATE ORDER STATUS
// ==========================================

const changeOrderStatus = async (orderId, status) => {
  if (!mongoose.Types.ObjectId.isValid(String(orderId))) {
    throw new Error("Invalid order ID");
  }

  if (!status) {
    throw new Error("Order status is required");
  }

  return await updateOrderStatus(orderId, status);
};

// ==========================================
// UPDATE PAYMENT STATUS
// ==========================================

const changePaymentStatus = async (orderId, status) => {
  if (!mongoose.Types.ObjectId.isValid(String(orderId))) {
    throw new Error("Invalid order ID");
  }

  if (!status) {
    throw new Error("Payment status is required");
  }

  return await updatePaymentStatus(orderId, status);
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  createNewOrder,
  getOrderDetails,
  getOrderItemDetails,
  getPaymentDetails,
  changeOrderStatus,
  changePaymentStatus,
};
