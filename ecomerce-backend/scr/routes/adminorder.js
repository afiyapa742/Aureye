const express = require("express");

const router = express.Router();

const {
  getAllOrders,
  getViewOrder,
  updateOrderItemStatus,
    updateDeliveryDate

} = require("../controllers/adminorder");

router.get("/orders", getAllOrders);

router.get("/orders/:orderId", getViewOrder);
router.put(
  "/orders/:orderId/items/:itemId/status",
  updateOrderItemStatus
);

/* ==========================================
   UPDATE DELIVERY DATE
========================================== */

router.put(
  "/orders/:orderId/delivery-date",
  updateDeliveryDate
);
module.exports = router;