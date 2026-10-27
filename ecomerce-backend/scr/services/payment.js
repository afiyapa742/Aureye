
const {
  OrdersController,
  CheckoutPaymentIntent
} = require("@paypal/paypal-server-sdk");

const paypalClient = require("../config/paypal");
const Order = require("../models/order");

const {
  createPayment,
  findPaymentByTransactionId,
  getPaymentByOrderId
} = require("../repositories/payment");

const ordersController = new OrdersController(paypalClient);

// =====================================================
// HELPERS
// =====================================================

// Convert the order's INR total to USD.
// The same rate must be used when creating and verifying
// the PayPal order.
const getUsdRate = () => {
  const rate = Number(process.env.INR_TO_USD);

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("Invalid INR_TO_USD rate");
  }

  return 1 / rate;
};

const getInrToUsdRate = () => {
  const rate = Number(process.env.INR_TO_USD);

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("Invalid INR_TO_USD rate");
  }

  return rate;
};

const convertINRToUSD = (inrAmount) => {
  const amount = Number(inrAmount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid order total");
  }

  return (amount * getInrToUsdRate()).toFixed(2);
};


// =====================================================
// CREATE PAYPAL ORDER
// =====================================================

const createPayPalOrder = async ({ orderId }) => {
  try {
    if (!orderId) {
      throw new Error("Order ID is required");
    }

    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error("Local order not found");
    }

    if (
      String(order.paymentstatus).toLowerCase() === "paid"
    ) {
      throw new Error("This order is already paid");
    }

    // Calculate the USD amount from the database order total.
    const paypalAmount = convertINRToUSD(order.total);
    const usdRate = getUsdRate();

    const frontendUrl =
      process.env.FRONTEND_URL || "http://localhost:5174";

    console.log("========== CREATE PAYPAL ORDER ==========");
    console.log("LOCAL ORDER ID:", String(order._id));
    console.log("ORDER TOTAL INR:", Number(order.total).toFixed(2));
    console.log("CONFIGURED INR PER USD:", usdRate);
    console.log("PAYPAL REQUEST AMOUNT USD:", paypalAmount);
    console.log(
      "ESTIMATED INR AT CONFIGURED RATE:",
      (Number(paypalAmount) * usdRate).toFixed(2)
    );

    const response = await ordersController.createOrder({
      body: {
        intent: CheckoutPaymentIntent.Capture,

        paymentSource: {
          paypal: {
            experienceContext: {
              landingPage: "LOGIN",
              userAction: "PAY_NOW",
              shippingPreference: "NO_SHIPPING",
              paymentMethodPreference:
                "IMMEDIATE_PAYMENT_REQUIRED",

              returnUrl:
                `${frontendUrl}/order-result/${order._id}?status=success`,

              cancelUrl:
                `${frontendUrl}/checkout?paypal=cancel`
            }
          }
        },

        purchaseUnits: [
          {
            referenceId: String(order._id),
            customId: String(order._id),

            amount: {
              currencyCode: "USD",
              value: paypalAmount
            }
          }
        ]
      },

      prefer: "return=minimal"
    });

    const paypalOrderId = response?.result?.id;

    if (!paypalOrderId) {
      throw new Error("PayPal did not return an order ID");
    }

    console.log("PAYPAL ORDER ID:", paypalOrderId);
    console.log("=========================================");

    return {
      paypalOrderId,
      amount: paypalAmount,
      currency: "USD",
      orderTotalINR: Number(order.total),
      configuredINRPerUSD: usdRate,
      estimatedINRAtConfiguredRate:
        Number(paypalAmount) * usdRate
    };
  } catch (error) {
    console.error("CREATE PAYPAL ORDER ERROR:", error);
    throw error;
  }
};

// =====================================================
// CAPTURE PAYPAL PAYMENT
// =====================================================

const capturePayPalPayment = async ({
  paypalOrderId,
  orderId
}) => {
  try {
    if (!paypalOrderId || !orderId) {
      throw new Error(
        "PayPal order ID and local order ID are required"
      );
    }

    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error("Local order not found");
    }

    // Return an existing successful payment if already recorded.
    const existingPayment = await getPaymentByOrderId(orderId);

    if (existingPayment?.paymentStatus === "paid") {
      return {
        success: true,
        payment: existingPayment,
        message: "Payment was already recorded"
      };
    }

    // Capture the PayPal order.
    const response = await ordersController.captureOrder({
      id: paypalOrderId
    });

    const paypalResult = response?.result;

    if (paypalResult?.status !== "COMPLETED") {
      throw new Error("PayPal payment was not completed");
    }

    // Match the returned PayPal purchase unit to this local order.
    const purchaseUnit = paypalResult?.purchaseUnits?.find(
      (unit) =>
        String(unit.customId || unit.referenceId) ===
        String(order._id)
    );

    if (!purchaseUnit) {
      throw new Error(
        "PayPal purchase unit does not match the local order"
      );
    }

    const capture =
      purchaseUnit?.payments?.captures?.find(
        (item) => item.status === "COMPLETED"
      );

    if (!capture) {
      throw new Error(
        "Completed PayPal capture was not found"
      );
    }

    const capturedAmount = Number(capture.amount?.value);
    const capturedCurrency = capture.amount?.currencyCode;
    const transactionId = capture.id;

    if (!transactionId) {
      throw new Error("PayPal transaction ID not found");
    }

    // IMPORTANT:
    // Verify against the amount actually recorded on the PayPal
    // order before capture, not a newly calculated exchange rate.
    //
    // The create-order amount is expected to be the local INR
    // total divided by the configured rate and rounded to cents.
    const expectedAmount = Number(
      convertINRToUSD(order.total)
    );

    console.log("========== CAPTURE VERIFICATION ==========");
    console.log("LOCAL ORDER ID:", String(order._id));
    console.log("LOCAL ORDER TOTAL INR:", Number(order.total).toFixed(2));
    console.log("EXPECTED PAYPAL USD:", expectedAmount.toFixed(2));
    console.log("CAPTURED PAYPAL USD:", capturedAmount);
    console.log("CAPTURED CURRENCY:", capturedCurrency);
    console.log("CAPTURE STATUS:", capture.status);

    if (
      capturedCurrency !== "USD" ||
      !Number.isFinite(capturedAmount) ||
      Math.abs(capturedAmount - expectedAmount) > 0.001
    ) {
      throw new Error(
        "Captured PayPal amount or currency does not match the expected order amount"
      );
    }

    // Prevent recording the same transaction twice.
    const existingTransaction =
      await findPaymentByTransactionId(transactionId);

    if (existingTransaction) {
      if (
        String(existingTransaction.orderId) !==
        String(orderId)
      ) {
        throw new Error(
          "This PayPal transaction belongs to another order"
        );
      }

      return {
        success: true,
        payment: existingTransaction,
        paypalOrderId,
        transactionId,
        capturedAmount,
        currency: capturedCurrency
      };
    }

    // Store the actual captured amount in USD.
  // Update the existing pending payment, or create one if missing.
let payment = await getPaymentByOrderId(orderId);

if (payment) {
  if (String(payment.paymentStatus).toLowerCase() === "paid") {
    return {
      success: true,
      payment,
      message: "Payment was already recorded"
    };
  }

  payment.paymentMethod = "ONLINE";
  payment.transactionId = transactionId;
  payment.amount = capturedAmount;
  payment.paymentStatus = "paid";
  payment.paidAt = new Date();

  await payment.save();
} else {
  payment = await createPayment({
    orderId,
    paymentMethod: "ONLINE",
    transactionId,
    amount: capturedAmount,
    paymentStatus: "paid",
    paidAt: new Date()
  });
}
    // Mark the order paid only after successful capture verification.
   // Mark the order paid and confirmed only after verified capture.
const updatedOrder = await Order.findByIdAndUpdate(
  orderId,
  {
    paymentstatus: "paid",
    orderstatus: "confirmed"
  },
  {
    new: true,
    runValidators: true
  }
);

if (!updatedOrder) {
  throw new Error(
    "Payment was captured, but the local order could not be updated. Reconciliation is required."
  );
}
    console.log("PAYMENT SAVED:", payment._id);
    console.log("==========================================");

    return {
      success: true,
      payment,
      paypalOrderId,
      transactionId,
      capturedAmount,
      currency: capturedCurrency
    };
  } catch (error) {
    console.error("CAPTURE PAYPAL PAYMENT ERROR:", error);
    throw error;
  }
};

// =====================================================
// MARK PAYMENT FAILED
// =====================================================

const markPaymentFailed = async ({ orderId, amount }) => {
  if (!orderId) {
    throw new Error("Order ID is required");
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Local order not found");
  }

  const existingPayment = await getPaymentByOrderId(orderId);

  // Never mark a successfully paid order as failed.
  if (
    String(order.paymentstatus).toLowerCase() === "paid" ||
    String(existingPayment?.paymentStatus).toLowerCase() === "paid"
  ) {
    return {
      success: true,
      alreadyPaid: true,
      payment: existingPayment
    };
  }

  let payment = existingPayment;

  if (!payment) {
    payment = await createPayment({
      orderId,
      paymentMethod: "ONLINE",
      transactionId: null,
      amount: Number(amount || 0),
      paymentStatus: "failed",
      paidAt: null
    });
  }

  // Record failure only when the payment is not already successful.
  if (
    String(payment.paymentStatus).toLowerCase() !== "paid"
  ) {
    payment.paymentStatus = "failed";
    await payment.save();
  }

  order.paymentstatus = "failed";
  order.orderstatus = "failed";
  await order.save();

  return {
    success: false,
    payment,
    message: "PayPal payment failed"
  };
};
// =====================================================
// EXPORT
// =====================================================

module.exports = {
  createPayPalOrder,
  capturePayPalPayment,
  markPaymentFailed
};
