// ==========================================================
// FILE:  services/userprofile.js   (REPLACE THE WHOLE FILE)
// ==========================================================

const crypto = require("crypto");

const profilerepository = require("../repositories/profilerepositories");

// ⚠️ Check this path. Use the same path your project already has
// for the address repository file.
const addressrepository = require("../repositories/addressrepositories");

const mailer = require("../utils/sendEmail");
const referralService = require("./referal");

// ==========================================
// SETTINGS
// ==========================================
const OTP_EXPIRY_MS = 10 * 60 * 1000;       // OTP valid for 10 minutes
const OTP_RESEND_COOLDOWN_MS = 30 * 1000;   // wait 30 seconds before new OTP
const OTP_MAX_ATTEMPTS = 5;                 // max wrong OTP tries

// ==========================================
// HELPERS
// ==========================================
const hashOtp = (otp) =>
  crypto.createHash("sha256").update(String(otp)).digest("hex");

const makeError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};


// ==========================================
// GET PROFILE
// ==========================================
const getProfile = async (userId) => {
  const user = await profilerepository.findById(userId);

  if (!user) {
    throw makeError("User not found", 404);
  }

  const addresses = await addressrepository.findAllByUserId(userId);

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
// UPDATE PROFILE (name, phone, image)
// ==========================================
const updateProfile = async (userId, updates) => {
  const allowedUpdates = ["FullName", "MobileNumber", "profileImage"];

  const filteredUpdates = {};

  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) {
      filteredUpdates[key] = updates[key];
    }
  }

  // Empty phone -> remove the field (a unique index does not allow
  // two users with an empty string "")
  if (filteredUpdates.MobileNumber === "") {
    delete filteredUpdates.MobileNumber;
    filteredUpdates.$unset = { MobileNumber: 1 };
  }

  let user;

  try {
    user = await profilerepository.updateById(userId, filteredUpdates);
  } catch (error) {
    if (error.code === 11000) {
      throw makeError("Mobile number already in use", 409);
    }
    throw error;
  }

  if (!user) {
    throw makeError("User not found", 404);
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
// REQUEST EMAIL CHANGE (send OTP)
// ==========================================
const requestEmailChange = async (userId, newEmail) => {
  const user = await profilerepository.findById(userId);

  if (!user) {
    throw makeError("User not found", 404);
  }

  // Google accounts cannot change email
  if (user.AuthProvider === "GOOGLE") {
    throw makeError("Email cannot be changed for Google accounts", 400);
  }

  if (!newEmail || !newEmail.trim()) {
    throw makeError("New email is required", 400);
  }

  newEmail = newEmail.trim().toLowerCase();

  if (user.email === newEmail) {
    throw makeError("New email must be different from current email", 400);
  }

  // Wait 30 seconds between OTP requests
  if (
    user.emailChangeOtpSentAt &&
    Date.now() - new Date(user.emailChangeOtpSentAt).getTime() <
      OTP_RESEND_COOLDOWN_MS
  ) {
    throw makeError(
      "Please wait 30 seconds before requesting another OTP",
      429
    );
  }

  // Email already used by someone else?
  const existing = await profilerepository.findByEmail(newEmail);

  if (existing) {
    throw makeError("Email already in use", 409);
  }

  // Create 6 digit OTP
  const otp = crypto.randomInt(100000, 1000000).toString();

  // Save pending email + hashed OTP
  await profilerepository.updateById(userId, {
    pendingEmail: newEmail,
    emailChangeOtp: hashOtp(otp),
    emailChangeOtpExpiry: new Date(Date.now() + OTP_EXPIRY_MS),
    emailChangeOtpAttempts: 0,
    emailChangeOtpSentAt: new Date(),
  });

  // Send the OTP to the NEW email
  await mailer(newEmail, otp);

  return { message: "OTP sent to your new email address" };
};


// ==========================================
// VERIFY EMAIL CHANGE (check OTP, save email)
// ==========================================
const verifyEmailChange = async (userId, otp) => {
  const user = await profilerepository.findById(userId);

  if (!user) {
    throw makeError("User not found", 404);
  }

  if (!user.pendingEmail || !user.emailChangeOtp) {
    throw makeError("No pending email change request", 400);
  }

  if (
    !user.emailChangeOtpExpiry ||
    user.emailChangeOtpExpiry < new Date()
  ) {
    throw makeError("OTP has expired. Please request a new one.", 400);
  }

  // Too many wrong tries
  if ((user.emailChangeOtpAttempts || 0) >= OTP_MAX_ATTEMPTS) {
    await profilerepository.updateById(userId, {
      pendingEmail: null,
      emailChangeOtp: null,
      emailChangeOtpExpiry: null,
      emailChangeOtpAttempts: 0,
    });

    throw makeError(
      "Too many wrong attempts. Please request a new OTP.",
      429
    );
  }

  // Compare OTP (safe compare)
  const given = Buffer.from(hashOtp(String(otp).trim()), "hex");
  const stored = Buffer.from(String(user.emailChangeOtp), "hex");

  const isMatch =
    given.length === stored.length && crypto.timingSafeEqual(given, stored);

  if (!isMatch) {
    await profilerepository.updateById(userId, {
      $inc: { emailChangeOtpAttempts: 1 },
    });

    throw makeError("Invalid OTP", 400);
  }

  // Check again that nobody took this email meanwhile
  const taken = await profilerepository.findByEmail(user.pendingEmail);

  if (taken && String(taken._id) !== String(userId)) {
    throw makeError("Email already in use", 409);
  }

  let updatedUser;

  try {
    updatedUser = await profilerepository.updateById(userId, {
      email: user.pendingEmail,
      pendingEmail: null,
      emailChangeOtp: null,
      emailChangeOtpExpiry: null,
      emailChangeOtpAttempts: 0,
      isVerified: true,
    });
  } catch (error) {
    if (error.code === 11000) {
      throw makeError("Email already in use", 409);
    }
    throw error;
  }

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