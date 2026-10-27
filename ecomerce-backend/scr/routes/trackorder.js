const express = require("express");

const router = express.Router();

const {
  getTrack,
} = require("../controllers/trackorder");

router.get(
  "/orders/:orderId/track/:itemId",
  getTrack
);

module.exports = router;