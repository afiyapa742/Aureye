

const {
  createNewOrder,
  getOrderDetails,
  getOrderItemDetails,
  getPaymentDetails,
  changeOrderStatus,
  changePaymentStatus
} = require("../services/checkout");


// ==========================================
// CREATE ORDER
// ==========================================

const CreateOrder = async (req, res) => {
  try {

    const {
      orderData,
      orderItems
    } = req.body;


    // ========================================
    // CHECK ORDER DATA
    // ========================================

    if (!orderData) {
      return res.status(400).json({
        message: "Order data is required"
      });
    }


    // ========================================
    // CHECK ORDER ITEMS
    // ========================================

    if (
      !Array.isArray(orderItems) ||
      orderItems.length === 0
    ) {
      return res.status(400).json({
        message: "Order items are required"
      });
    }


    // ========================================
    // CHECK USER LOGIN
    // ========================================

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: "User authentication required"
      });
    }


    // ========================================
    // VALIDATE PAYMENT METHOD
    // ========================================

    const paymentMethod = String(
      orderData.paymentmethod || ""
    ).toUpperCase();

    if (!["COD", "ONLINE", "WALLET"].includes(paymentMethod)) {
      return res.status(400).json({
        message: "Invalid payment method"
      });
    }


    // ========================================
    // ADD USER ID
    // ========================================

    orderData.userId = req.user.id;


    // ========================================
    // SET PAYMENT DETAILS
    // ========================================

    orderData.paymentmethod = paymentMethod;
    orderData.paymentstatus = "pending";


    // ========================================
    // LOG DATA
    // ========================================

    console.log(
      "ORDER USER ID:",
      req.user.id
    );

    console.log(
      "ORDER PAYMENT METHOD:",
      paymentMethod
    );

    console.log(
      "ORDER DATA:",
      orderData
    );

    console.log(
      "ORDER ITEMS:",
      orderItems
    );


    // ========================================
    // CREATE ORDER
    // ========================================

    const result = await createNewOrder(
      orderData,
      orderItems
    );


    // ========================================
    // SUCCESS RESPONSE
    // ========================================

    return res.status(201).json({
      message: "Order placed successfully",
      data: result
    });

  } catch (error) {

    console.error(
      "CREATE ORDER ERROR:",
      error
    );

    return res.status(400).json({
      message: error.message
    });

  }
};


// ==========================================
// GET ORDER
// ==========================================

const GetOrder = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("GET ORDER ID:", id);
    console.log("USER ID:", req.user?.id);

    const order = await getOrderDetails(id);

    console.log("ORDER FOUND:", order);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("GET ORDER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch order",
    });
  }
};
// ==========================================
// GET ORDER ITEMS
// ==========================================

const GetOrderItems = async (req, res) => {
  try {

    const { id } = req.params;

    const items = await getOrderItemDetails(id);

    return res.status(200).json({
      message: "Order items fetched successfully",
      data: items
    });

  } catch (error) {

    console.error(
      "GET ORDER ITEMS ERROR:",
      error
    );

    return res.status(400).json({
      message: error.message
    });

  }
};


// ==========================================
// GET PAYMENT
// ==========================================

const GetOrderPayment = async (req, res) => {
  try {

    const { id } = req.params;

    const payment = await getPaymentDetails(id);

    return res.status(200).json({
      message: "Payment fetched successfully",
      data: payment
    });

  } catch (error) {

    console.error(
      "GET PAYMENT ERROR:",
      error
    );

    return res.status(400).json({
      message: error.message
    });

  }
};


// ==========================================
// UPDATE ORDER STATUS
// ==========================================

const UpdateOrderStatus = async (req, res) => {
  try {

    const { id } = req.params;
    const { status } = req.body;

    const order = await changeOrderStatus(
      id,
      status
    );

    return res.status(200).json({
      message: "Order status updated successfully",
      data: order
    });

  } catch (error) {

    console.error(
      "UPDATE ORDER STATUS ERROR:",
      error
    );

    return res.status(400).json({
      message: error.message
    });

  }
};


// ==========================================
// UPDATE PAYMENT STATUS
// ==========================================

const UpdatePaymentStatus = async (req, res) => {
  try {

    const { id } = req.params;
    const { paymentStatus } = req.body;

    const payment = await changePaymentStatus(
      id,
      paymentStatus
    );

    return res.status(200).json({
      message: "Payment status updated successfully",
      data: payment
    });

  } catch (error) {

    console.error(
      "UPDATE PAYMENT STATUS ERROR:",
      error
    );

    return res.status(400).json({
      message: error.message
    });

  }
};


// ==========================================
// EXPORT
// ==========================================

module.exports = {
  CreateOrder,
  GetOrder,
  GetOrderItems,
  GetOrderPayment,
  UpdateOrderStatus,
  UpdatePaymentStatus
};
