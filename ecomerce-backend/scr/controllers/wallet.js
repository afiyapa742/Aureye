
const {
  GetWallet,
  CreateWalletTopUp,
  CaptureWalletTopUp,
  WalletPayment
} = require("../services/wallet");


/* =====================================
   GET WALLET
===================================== */

const getWalletController = async (req, res) => {
  try {

    const userId = req.user.id;

    const wallet = await GetWallet(userId);

    return res.status(200).json({
      success: true,
      message: "Wallet fetched successfully",
      data: wallet
    });

  } catch (error) {

    console.error("GET WALLET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


/* =====================================
   CREATE PAYPAL WALLET ORDER
===================================== */

const createWalletTopUpController = async (req, res) => {
  try {

    const userId = req.user.id;
    const { amount } = req.body;

    if (
      amount === undefined ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) < 1 ||
      Number(amount) > 100000
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid amount between 1 and 100000"
      });
    }

    const result = await CreateWalletTopUp(
      userId,
      Number(amount)
    );

    return res.status(200).json({
      success: true,
      message: "PayPal order created successfully",
      data: result
    });

  } catch (error) {

    console.error("CREATE WALLET TOP-UP ERROR:", error);

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


/* =====================================
   CAPTURE PAYPAL WALLET PAYMENT
===================================== */

const captureWalletTopUpController = async (req, res) => {
  try {

    const userId = req.user.id;
    const { paypalOrderId } = req.body;

    if (!paypalOrderId) {
      return res.status(400).json({
        success: false,
        message: "PayPal order ID is required"
      });
    }

    const result = await CaptureWalletTopUp(
      userId,
      paypalOrderId
    );

    return res.status(200).json({
      success: true,
      message: "Money added to wallet successfully",
      data: result
    });

  } catch (error) {

    console.error("CAPTURE WALLET PAYMENT ERROR:", error);

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


/* =====================================
   WALLET PAYMENT
===================================== */

const walletPaymentController = async (req, res) => {
  try {

    const userId = req.user.id;
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }

    const result = await WalletPayment(
      userId,
      orderId
    );

    return res.status(200).json({
      success: true,
      message: "Wallet payment successful",
      data: result
    });

  } catch (error) {

    console.error("WALLET PAYMENT ERROR:", error);

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


/* =====================================
   EXPORT
===================================== */

module.exports = {
  getWalletController,
  createWalletTopUpController,
  captureWalletTopUpController,
  walletPaymentController
};
