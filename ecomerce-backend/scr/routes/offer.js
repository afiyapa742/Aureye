
const express = require("express");
const router = express.Router();

const offerController = require("../controllers/offer");

// Existing controller
const {
  getNextOfferForUser,
} = require("../controllers/userOfferController");

const protect = require("../auth/authMiddleware");

// Existing routes
router.post("/offers", offerController.createOffer);

router.get("/offers", offerController.getAllOffers);

// IMPORTANT: Register this BEFORE /offers/:id
router.get(
  "/offers/next-for-user",
  protect,
  getNextOfferForUser
);

router.get(
  "/offers/active",
  offerController.getActiveOffer
);

router.get("/offers/:id", offerController.getOfferById);

router.put("/offers/:id", offerController.updateOffer);

router.delete("/offers/:id", offerController.deleteOffer);

module.exports = router;
