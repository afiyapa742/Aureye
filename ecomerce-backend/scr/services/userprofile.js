const crypto = require("crypto");

const profilerepository = require("../repositories/profilerepositories");

// Keep your existing address repository import here
// Example:
// const addressrepository = require("../repositories/addressrepositories");

const mailer = require("../utils/sendEmail");
const referralService = require("./referal");
// OTP expiry = 10 minutes
const OTP_EXPIRY_MS = 10 * 60 * 1000;


// ==========================================
// GET PROFILE
// ==========================================

const getProfile = async (userId) => {
  const user = await profilerepository.findById(userId);

  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const addresses =
    await addressrepository.findAllByUserId(userId);

  return {
    _id: user._id,
    FullName: user.FullName,
    email: user.email,
    MobileNumber: user.MobileNumber,
    profileImage: user.profileImage,
    AuthProvider: user.AuthProvider,
    status: user.status,
    addresses,
  };
};


// ==========================================
// UPDATE PROFILE
// ==========================================

const updateProfile = async (userId, updates) => {
  const allowedUpdates = [
    "FullName",
    "MobileNumber",
    "profileImage",
  ];

  const filteredUpdates = {};

  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) {
      filteredUpdates[key] = updates[key];
    }
  }

  const user =
    await profilerepository.updateById(
      userId,
      filteredUpdates
    );

  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  return {
    _id: user._id,
    FullName: user.FullName,
    email: user.email,
    MobileNumber: user.MobileNumber,
    profileImage: user.profileImage,
    AuthProvider: user.AuthProvider,
    status: user.status,
  };
};


// ==========================================
// REQUEST EMAIL CHANGE
// ==========================================

const requestEmailChange = async (
  userId,
  newEmail
) => {

  // Find current user
  const user =
    await profilerepository.findById(userId);

  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }


  // Check new email
  if (!newEmail || !newEmail.trim()) {
    const err = new Error("New email is required");
    err.statusCode = 400;
    throw err;
  }


  // Remove spaces and convert to lowercase
  newEmail = newEmail.trim().toLowerCase();


  // Check same email
  if (user.email === newEmail) {
    const err = new Error(
      "New email must be different from current email"
    );

    err.statusCode = 400;
    throw err;
  }


  // Check whether email already exists
  const existing =
    await profilerepository.findByEmail(newEmail);

  if (existing) {
    const err = new Error(
      "Email already in use"
    );

    err.statusCode = 409;
    throw err;
  }


  // Generate 6 digit OTP
  const otp =
    crypto.randomInt(100000, 1000000).toString();


  // OTP expires after 10 minutes
  const otpExpiry =
    new Date(Date.now() + OTP_EXPIRY_MS);


  // Save pending email + OTP
  await profilerepository.updateById(
    userId,
    {
      pendingEmail: newEmail,
      emailChangeOtp: otp,
      emailChangeOtpExpiry: otpExpiry,
    }
  );


  // Send OTP to new email
  await mailer(
    newEmail,
    otp
  );


  return {
    message: "OTP sent to your new email address",
  };
};


// ==========================================
// VERIFY EMAIL CHANGE
// ==========================================

const verifyEmailChange = async (
  userId,
  otp
) => {

  // Find user
  const user =
    await profilerepository.findById(userId);

  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }


  // Check pending email change
  if (
    !user.pendingEmail ||
    !user.emailChangeOtp
  ) {
    const err = new Error(
      "No pending email change request"
    );

    err.statusCode = 400;
    throw err;
  }


  // Check OTP expiry
  if (
    !user.emailChangeOtpExpiry ||
    user.emailChangeOtpExpiry < new Date()
  ) {
    const err = new Error(
      "OTP has expired"
    );

    err.statusCode = 400;
    throw err;
  }


  // Check OTP
  if (
    String(user.emailChangeOtp) !==
    String(otp)
  ) {
    const err = new Error(
      "Invalid OTP"
    );

    err.statusCode = 400;
    throw err;
  }


  // OTP is correct
  // Now update the actual email
  const updatedUser =
    await profilerepository.updateById(
      userId,
      {
        email: user.pendingEmail,

        pendingEmail: null,

        emailChangeOtp: null,

        emailChangeOtpExpiry: null,

        isVerified: true,
      }
    );


  return {
    _id: updatedUser._id,
    FullName: updatedUser.FullName,
    email: updatedUser.email,
    MobileNumber: updatedUser.MobileNumber,
    profileImage: updatedUser.profileImage,
    AuthProvider: updatedUser.AuthProvider,
    status: updatedUser.status,
  };
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