const {
  getAllReturns,
  getReturnById,
  changeReturnStatus,
  receiveReturnedProduct,
  processReturnRefund
} = require("../services/return");


// =====================================================
// GET ALL
// =====================================================

const getAllReturnsController =
  async (req, res) => {

    try {

      const returns =
        await getAllReturns();

      res.status(200).json({
        success: true,
        data: returns
      });

    } catch (error) {

      console.error(
        "GET ALL RETURNS ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          error.message
      });
    }
  };


// =====================================================
// GET ONE
// =====================================================

const getReturnByIdController =
  async (req, res) => {

    try {

      const { itemId } =
        req.params;

      const returnRequest =
        await getReturnById(
          itemId
        );

      res.status(200).json({
        success: true,
        data: returnRequest
      });

    } catch (error) {

      console.error(
        "GET RETURN ERROR:",
        error
      );

      res.status(404).json({
        success: false,
        message:
          error.message
      });
    }
  };


// =====================================================
// ACCEPT RETURN
// =====================================================

const updateReturnStatusController =
  async (req, res) => {

    try {

      const { itemId } =
        req.params;

      const { status } =
        req.body;

      if (
        status !==
        "return_approved"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Only return approval is allowed"
        });
      }


      const updatedReturn =
        await changeReturnStatus(
          itemId,
          status
        );


      res.status(200).json({
        success: true,
        message:
          "Return request accepted successfully",
        data: updatedReturn
      });

    } catch (error) {

      console.error(
        "UPDATE RETURN STATUS ERROR:",
        error
      );

      res.status(400).json({
        success: false,
        message:
          error.message
      });
    }
  };


// =====================================================
// MARK PRODUCT RECEIVED
// =====================================================

const receiveReturnedProductController =
  async (req, res) => {

    try {

      const { itemId } =
        req.params;

      const updatedReturn =
        await receiveReturnedProduct(
          itemId
        );


      res.status(200).json({
        success: true,
        message:
          "Returned product received successfully",
        data: updatedReturn
      });

    } catch (error) {

      console.error(
        "RETURN RECEIVED ERROR:",
        error
      );

      res.status(400).json({
        success: false,
        message:
          error.message
      });
    }
  };


// =====================================================
// REFUND
// =====================================================

const refundReturnController =
  async (req, res) => {

    try {

      const { itemId } =
        req.params;


      const result =
        await processReturnRefund(
          itemId
        );


      res.status(200).json({
        success: true,
        message:
          result.message,
        refundAmount:
          result.refundAmount,
        data:
          result.data
      });

    } catch (error) {

      console.error(
        "RETURN REFUND ERROR:",
        error
      );

      res.status(400).json({
        success: false,
        message:
          error.message
      });
    }
  };


module.exports = {
  getAllReturnsController,
  getReturnByIdController,
  updateReturnStatusController,
  receiveReturnedProductController,
  refundReturnController
};