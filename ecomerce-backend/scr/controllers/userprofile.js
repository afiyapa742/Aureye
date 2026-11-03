// ==========================================================
// FILE:  your profile CONTROLLER file   (REPLACE THE WHOLE FILE)
// (the one that has getProfile, updateProfile,
//  requestEmailChange, verifyEmailChange)
// ==========================================================

const profileService = require("../services/userprofile");


// ==========================================
// GET PROFILE
// ==========================================
const getProfile = async (req, res) => {
  try {
    const user = await profileService.getProfile(req.user.id);

    res.status(200).json(user);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.message,
    });
  }
};


// ==========================================
// UPDATE PROFILE
// ==========================================
const updateProfile = async (req, res) => {
  try {
    const { FullName, MobileNumber } = req.body;

    // Full Name validation
    if (!FullName || !FullName.trim()) {
      return res.status(400).json({
        message: "Full name is required",
      });
    }

    if (!/^[a-zA-Z\s]+$/.test(FullName.trim())) {
      return res.status(400).json({
        message: "Full name must contain only letters and spaces",
      });
    }

    // Mobile Number validation
    if (MobileNumber && !/^\d{10}$/.test(MobileNumber)) {
      return res.status(400).json({
        message: "Mobile number must contain 10 digits",
      });
    }

    const updatedUser = await profileService.updateProfile(
      req.user.id,
      req.body
    );

    res.status(200).json({
      user: updatedUser,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.message,
    });
  }
};


// ==========================================
// REQUEST EMAIL CHANGE (send OTP)
// ==========================================
const requestEmailChange = async (req, res) => {
  try {
    const { newEmail } = req.body;

    if (!newEmail || !newEmail.trim()) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const result = await profileService.requestEmailChange(
      req.user.id,
      newEmail
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.message,
    });
  }
};


// ==========================================
// VERIFY EMAIL CHANGE (check OTP)
// ==========================================
const verifyEmailChange = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp || !String(otp).trim()) {
      return res.status(400).json({
        message: "OTP is required",
      });
    }

    const result = await profileService.verifyEmailChange(
      req.user.id,
      String(otp)
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.message,
    });
  }
};


// ==========================================
// EXPORT
// ==========================================
module.exports = {
  getProfile,
  updateProfile,
  requestEmailChange,
  verifyEmailChange,
};