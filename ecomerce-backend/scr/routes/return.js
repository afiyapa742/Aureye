const express = require("express");

const router = express.Router();

const {
  getAllReturnsController,
  getReturnByIdController,
  updateReturnStatusController,
  receiveReturnedProductController,
  refundReturnController
} = require("../controllers/return");


// GET
router.get(
  "/returns",
  getAllReturnsController
);


// GET ONE
router.get(
  "/returns/:itemId",
  getReturnByIdController
);


// ACCEPT RETURN
router.put(
  "/returns/:itemId/status",
  updateReturnStatusController
);


// MARK PRODUCT RECEIVED
router.put(
  "/returns/:itemId/received",
  receiveReturnedProductController
);


// REFUND TO WALLET
router.put(
  "/returns/:itemId/refund",
  refundReturnController
);


module.exports = router;