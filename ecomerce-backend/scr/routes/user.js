const express = require("express");

const router = express.Router();
const {getCategory}=require("../controllers/category")
// ==========================================
// AUTH CONTROLLER
// ==========================================

const {
  registerUser,
  verifyOtp,
  resendOtp,
  loginUser,
  googleLogin,
  forgetPassword,
  resetPassword,
  verifyForgotPasswordOtp,
  updateProfile,
  getProfile,
  RemoveProfile,
  requestChangePassword,
  verifyChangePassword
} = require("../controllers/user");

// ==========================================
// ADDRESS CONTROLLER
// ==========================================

const {
  getAdress,
  addAddress,
  updateAddress,
  deleteAddress,
} = require("../controllers/adress");

// ==========================================
// AUTH MIDDLEWARE
// ==========================================

const protect = require("../auth/authMiddleware");

// ==========================================
// AUTH ROUTES
// ==========================================

router.post("/register", registerUser);

router.post("/verify-otp", verifyOtp);

router.post("/resend-otp", resendOtp);

router.post("/login", loginUser);

router.post("/googlelogin", googleLogin);

router.post("/forgot-password", forgetPassword);

router.post(
  "/verify-forgot-password-otp",
  verifyForgotPasswordOtp
);

router.post(
  "/reset-password",
  resetPassword
);
// ==========================================
// ADDRESS ROUTES
// ==========================================

router.get(
  "/address",
  protect,
  getAdress
);

router.post(
  "/address",
  protect,
  addAddress
);

router.put(
  "/address/:addressId",
  protect,
  updateAddress
);

router.delete(
  "/address/:addressId",
  protect,
  deleteAddress
);

// ==========================================
// PROFILE ROUTES
// ==========================================

// UPDATE PROFILE IMAGE
router.put(
  "/profile/update",
  protect,
  updateProfile
);

// GET PROFILE
router.get(
  "/profile",
  protect,
  getProfile
);
router.post(
  "/change-password",
  protect,
  requestChangePassword
);

router.post(
  "/verify-change-password",
  protect,
  verifyChangePassword
);
router.get("/category",getCategory)
router.delete("/removeprofile",protect,
  RemoveProfile)
module.exports = router;