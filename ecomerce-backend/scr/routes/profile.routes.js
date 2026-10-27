const express = require("express");

const router = express.Router();

// ==========================================
// PROFILE CONTROLLER
// ==========================================

const {
  getProfile,
  updateProfile,
  requestEmailChange,
  verifyEmailChange,
} = require("../controllers/userprofile");

// ==========================================
// AUTH MIDDLEWARE
// ==========================================

const protect = require("../auth/authMiddleware");

// ==========================================
// GET PROFILE
// ==========================================

router.get(
  "/profile",
  protect,
  getProfile
);

// ==========================================
// UPDATE PROFILE
// FullName
// MobileNumber
// profileImage
// ==========================================

router.put(
  "/profile/update",
  protect,
  updateProfile
);

// ==========================================
// REQUEST EMAIL CHANGE
// ==========================================

router.post(
  "/profile/email-change",
  protect,
  requestEmailChange
);

// ==========================================
// VERIFY EMAIL CHANGE OTP
// ==========================================

router.post(
  "/profile/email-change/verify",
  protect,
  verifyEmailChange
);

// ==========================================
// EXPORT
// ==========================================

module.exports = router;