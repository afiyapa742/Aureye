const {
  createPayPalOrder,
  capturePayPalPayment,
  markPaymentFailed
} = require("../services/payment");


const createPaypalOrderController =
  async (req, res) => {

    try {

      const {
        orderId
      } = req.body;


      console.log(
        "CREATE PAYPAL REQUEST:",
        req.body
      );


      const result =
        await createPayPalOrder({
          orderId
        });


      return res.status(200).json({

        success: true,

        message:
          "PayPal order created successfully",

        data:
          result

      });

    } catch (error) {

      console.error(
        "CREATE PAYPAL CONTROLLER ERROR:",
        error
      );


      return res.status(
        error?.statusCode || 500
      ).json({

        success: false,

        message:
          error?.body?.message ||
          error?.message ||
          "Unable to create PayPal order",

        paypalError:
          error?.body || null

      });

    }
  };


const capturePaypalOrderController =
  async (req, res) => {

    try {

      const {
        paypalOrderId,
        orderId
      } = req.body;


      const result =
        await capturePayPalPayment({

          paypalOrderId,

          orderId

        });


      return res.status(200).json({

        success: true,

        message:
          "Payment completed successfully",

        data:
          result

      });

    } catch (error) {

      console.error(
        "CAPTURE PAYPAL CONTROLLER ERROR:",
        error
      );


      return res.status(
        error?.statusCode || 400
      ).json({

        success: false,

        message:
          error?.body?.message ||
          error?.message ||
          "Payment failed",

        paypalError:
          error?.body || null

      });

    }
  };


const paymentFailedController =
  async (req, res) => {

    try {

      const {
        orderId,
        amount
      } = req.body;


      const payment =
        await markPaymentFailed({

          orderId,

          amount

        });


      return res.status(200).json({

        success: true,

        message:
          "Payment failure saved",

        data:
          payment

      });

    } catch (error) {

      return res.status(500).json({

        success: false,

        message:
          error?.message ||
          "Unable to save payment failure"

      });

    }
  };


module.exports = {

  createPaypalOrderController,

  capturePaypalOrderController,

  paymentFailedController

};