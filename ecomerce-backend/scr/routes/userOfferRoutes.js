
const express = require("express");
const router = express.Router();

const {
  getNextOfferForUser,
} = require("../controllers/userOfferController");

const protect = require("../auth/authMiddleware");

router.get("/next-for-user", protect, getNextOfferForUser);

module.exports = router;
