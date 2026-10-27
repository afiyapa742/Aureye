const express = require("express");

const router = express.Router();

const {
  getStock,
} = require("../controllers/admin inventory");

router.get(
  "/inventory",
  getStock
);

module.exports = router;