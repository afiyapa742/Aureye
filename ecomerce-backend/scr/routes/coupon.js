const express = require("express");

const router = express.Router();

const couponController = require("../controllers/coupon");

// Create coupon
router.post("/coupons", couponController.createCoupon);

// Get all coupons
router.get("/coupons", couponController.getAllCoupons);

// Get single coupon
router.get("/coupons/:id", couponController.getCouponById);

// Update coupon
router.put("/coupons/:id", couponController.updateCoupon);

// Delete coupon
router.delete("/coupons/:id", couponController.deleteCoupon);
router.get(
  "/coupons/:id/eligibility",
  couponController.checkCouponEligibility
);
module.exports = router;