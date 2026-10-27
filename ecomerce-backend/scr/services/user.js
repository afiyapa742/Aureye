const bcrypt = require("bcrypt");

const userRepositories = require("../repositories/userrepositories");

const generateToken = require("../utils/generateToken");

const generateOtp = require("../utils/generateOtp");

const sendOtpEmail = require("../utils/sendEmail");

const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

const { Signgoogle } = require("../repositories/userrepositories");


// ==========================================
// REGISTER USER
// ==========================================


const registerUser = async ({
  FullName,
  email,
  password,
  MobileNumber,
  referralCode,
}) => {
  try {
    // Normalize email and referral code
    email = String(email).trim().toLowerCase();

    referralCode = referralCode
      ? String(referralCode).trim().toUpperCase()
      : null;

    // Check whether the user already exists
    const existingUser = await userRepositories.findByEmail(email);

    if (existingUser) {
      // Do not register an already verified user again
      if (existingUser.isVerified) {
        throw new Error("User already exists. Please login.");
      }

      // Validate referral code when retrying an unverified registration
      if (referralCode) {
        const referrer = await referralService.findReferrerByCode(
          referralCode
        );

        if (!referrer) {
          throw new Error("Invalid referral code.");
        }

        if (String(referrer._id) === String(existingUser._id)) {
          throw new Error("You cannot use your own referral code.");
        }
      }

      // Generate a fresh OTP
      const otp = generateOtp();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

      existingUser.otp = otp;
      existingUser.otpExpiry = otpExpiry;

      // Save referral code temporarily until OTP verification
      if (referralCode) {
        existingUser.pendingReferralCode = referralCode;
      }

      await existingUser.save();

      await sendOtpEmail(email, otp);

      return {
        message: "OTP sent successfully. Please verify your email.",
        email,
      };
    }

    // Validate referral code before creating the user
    if (referralCode) {
      const referrer = await referralService.findReferrerByCode(
        referralCode
      );

      if (!referrer) {
        throw new Error("Invalid referral code.");
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Create new unverified user
    const newUser = await userRepositories.createUser({
      FullName,
      email,
      password: hashedPassword,
      MobileNumber,
      isVerified: false,
      otp,
      otpExpiry,
      ...(referralCode ? { pendingReferralCode: referralCode } : {}),
    });

    // Send OTP
    await sendOtpEmail(email, otp);

    return {
      message: "Registration successful. Please verify your email.",
      email: newUser.email,
    };
  } catch (error) {
    throw error;
  }
};



// ==========================================
// VERIFY OTP - SIGNUP ONLY
// ==========================================

const verifyOtp = async ({
  email,
  otp,
}) => {

  const user =
    await userRepositories.findByEmail(
      email
    );


  if (!user) {

    const err =
      new Error(
        "User not found"
      );

    err.statusCode = 404;

    throw err;
  }


  // IMPORTANT:
  // This function is ONLY for signup OTP.
  // Forgot password should NOT call this.

  if (user.isVerified) {

    const err =
      new Error(
        "User already verified"
      );

    err.statusCode = 400;

    throw err;
  }


  // ==========================================
  // CHECK OTP
  // ==========================================

  if (
    String(user.otp) !==
    String(otp)
  ) {

    const err =
      new Error(
        "Invalid OTP"
      );

    err.statusCode = 400;

    throw err;
  }


  // ==========================================
  // CHECK OTP EXPIRY
  // ==========================================

  if (
    !user.otpExpiry ||
    user.otpExpiry < new Date()
  ) {

    const err =
      new Error(
        "OTP expired"
      );

    err.statusCode = 400;

    throw err;
  }


  // ==========================================
  // VERIFY USER
  // ==========================================

  user.isVerified = true;

  user.otp = undefined;

  user.otpExpiry = undefined;


  await userRepositories.saveUser(
    user
  );


  // ==========================================
  // GENERATE TOKEN
  // ==========================================

  const token =
    generateToken(
      user._id
    );


  return {

    _id:
      user._id,

    FullName:
      user.FullName,

    email:
      user.email,

    MobileNumber:
      user.MobileNumber,

    token,
  };
};


// ==========================================
// RESEND OTP - SIGNUP
// ==========================================

const resendOtp = async ({
  email,
}) => {

  const user =
    await userRepositories.findByEmail(
      email
    );


  if (!user) {

    const err =
      new Error(
        "User not found"
      );

    err.statusCode = 404;

    throw err;
  }


  if (user.isVerified) {

    const err =
      new Error(
        "User is already verified"
      );

    err.statusCode = 400;

    throw err;
  }


  // ==========================================
  // NEW OTP
  // ==========================================

  const otp =
    generateOtp();

  const otpExpiry =
    new Date(
      Date.now() + 10 * 60 * 1000
    );


  user.otp = otp;

  user.otpExpiry =
    otpExpiry;


  await userRepositories.saveUser(
    user
  );


  await sendOtpEmail(
    email,
    otp
  );


  return {

    message:
      "New OTP sent to your email.",

    email:
      user.email,

  };
};


// ==========================================
// LOGIN USER
// ==========================================

const loginUser = async ({
  email,
  password,
}) => {

  const user =
    await userRepositories.findByEmail(
      email
    );


  if (!user) {

    const err =
      new Error(
        "Invalid email or password"
      );

    err.statusCode = 401;

    throw err;
  }


  // ==========================================
  // CHECK BLOCKED USER
  // ==========================================

  if (user.status === "BLOCKED") {

    const err = new Error(
      "Your account has been blocked by the admin"
    );

    err.statusCode = 403;

    throw err;
  }


  // ==========================================
  // USER MUST VERIFY EMAIL
  // ==========================================

  if (!user.isVerified) {

    const err =
      new Error(
        "Please verify your email with OTP before logging in"
      );

    err.statusCode = 403;

    throw err;
  }


  // ==========================================
  // CHECK PASSWORD
  // ==========================================

  const isMatch =
    await bcrypt.compare(
      password,
      user.password
    );


  if (!isMatch) {

    const err =
      new Error(
        "Invalid email or password"
      );

    err.statusCode = 401;

    throw err;
  }


  // ==========================================
  // GENERATE TOKEN
  // ==========================================

  const token =
    generateToken(
      user._id
    );


  return {

    _id:
      user._id,

    FullName:
      user.FullName,

    email:
      user.email,

    MobileNumber:
      user.MobileNumber,

    token,

  };
};


// ==========================================
// FORGOT PASSWORD
// ==========================================

const forgetPassword = async ({
  email,
}) => {

  const user =
    await userRepositories.findByEmail(
      email
    );


  if (!user) {

    const err =
      new Error(
        "No account found with this email"
      );

    err.statusCode = 404;

    throw err;
  }


  // ==========================================
  // GENERATE FORGOT PASSWORD OTP
  // ==========================================

  const otp =
    generateOtp();

  const otpExpiry =
    new Date(
      Date.now() + 10 * 60 * 1000
    );


  user.otp =
    otp;

  user.otpExpiry =
    otpExpiry;


  await userRepositories.saveUser(
    user
  );


  // ==========================================
  // SEND OTP
  // ==========================================

  await sendOtpEmail(
    email,
    otp
  );


  return {

    message:
      "OTP sent to your email for password reset",

    email:
      user.email,

  };
};


// ==========================================
// RESET PASSWORD
// ==========================================

const resetPassword = async ({
  email,
  otp,
  newPassword,
}) => {

  const user =
    await userRepositories.findByEmail(
      email
    );


  if (!user) {

    const err =
      new Error(
        "User not found"
      );

    err.statusCode = 404;

    throw err;
  }


  // ==========================================
  // CHECK OTP
  // ==========================================

  if (
    String(user.otp) !==
    String(otp)
  ) {

    const err =
      new Error(
        "Invalid OTP"
      );

    err.statusCode = 400;

    throw err;
  }


  // ==========================================
  // CHECK OTP EXPIRY
  // ==========================================

  if (
    !user.otpExpiry ||
    user.otpExpiry < new Date()
  ) {

    const err =
      new Error(
        "OTP expired"
      );

    err.statusCode = 400;

    throw err;
  }


  // ==========================================
  // HASH NEW PASSWORD
  // ==========================================

  const hashedPassword =
    await bcrypt.hash(
      newPassword,
      10
    );


  user.password =
    hashedPassword;

  user.otp =
    undefined;

  user.otpExpiry =
    undefined;


  await userRepositories.saveUser(
    user
  );


  return {

    message:
      "Password reset successful. Please login with your new password.",

  };
};


const verifyForgotPasswordOtp = async ({
  email,
  otp,
}) => {

  const user =
    await userRepositories.findByEmail(email);


  if (!user) {

    const err = new Error("User not found");

    err.statusCode = 404;

    throw err;
  }


  if (!user.otp) {

    const err = new Error("OTP not found");

    err.statusCode = 400;

    throw err;
  }


  if (String(user.otp) !== String(otp)) {

    const err = new Error("Invalid OTP");

    err.statusCode = 400;

    throw err;
  }


  if (
    !user.otpExpiry ||
    user.otpExpiry < new Date()
  ) {

    const err = new Error("OTP expired");

    err.statusCode = 400;

    throw err;
  }


  return {

    message: "OTP verified successfully",

  };
};


// ==========================================
// GOOGLE LOGIN
// ==========================================

const googleLogin = async ({
  idToken,
}) => {

  const ticket =
    await client.verifyIdToken({

      idToken,

      audience:
        process.env.GOOGLE_CLIENT_ID,

    });


  const payload =
    ticket.getPayload();


  const {
    email,
    name,
    sub: googleId,
    picture,
  } = payload;


  let user =
    await userRepositories.findByEmail(
      email
    );


  // ==========================================
  // CREATE GOOGLE USER
  // ==========================================

  if (!user) {

    user =
      await userRepositories.createUser({

        FullName:
          name,

        email,

        googleId,

        profileImage:
          picture,

        AuthProvider:
          "GOOGLE",

        isVerified:
          true,
      });
  }


  // ==========================================
  // EXISTING LOCAL USER
  // ==========================================

  else if (!user.googleId) {

    user.googleId =
      googleId;

    user.AuthProvider =
      "GOOGLE";


    if (!user.profileImage) {

      user.profileImage =
        picture;
    }


    user.isVerified =
      true;


    await userRepositories.saveUser(
      user
    );
  }


  // ==========================================
  // GENERATE TOKEN
  // ==========================================

  const token =
    generateToken(
      user._id
    );


  return {

    _id:
      user._id,

    FullName:
      user.FullName,

    email:
      user.email,

    profileImage:
      user.profileImage,

    token,

  };
};


//profileupdat//

const updateUserProfile = async (id, profileImage) => {

  const user = await userRepositories.findById(id);

  if (!user) {

    throw new Error("User not found");

  }


  const updatedUser = await userRepositories.updateProfile(
    id,
    {
      profileImage: profileImage
    }
  );


  return updatedUser;
};


const getUserProfile = async (id ,pro) => {

  const user = await userRepositories.findById(id);

  if (!user) {

    throw new Error("User not found");

  }


  return user;

};


const removeProfile = async(id,profileImage)=>{

  const user = await userRepositories.findById(id)

  if(!user){

    throw new Error("User not fount")

  }


  const Updateuser = await userRepositories.updateProfile(
    id,

    {
      profileImage: ""
    }

  )


  return Updateuser;
};


// ==========================================
// CHANGE PASSWORD - REQUEST OTP
// ==========================================

const requestChangePassword = async (
  userId,
  currentPassword,
  newPassword,
  confirmPassword
) => {

  const user = await userRepositories.findById(userId);

  if (!user) {

    const err = new Error("User not found");

    err.statusCode = 404;

    throw err;

  }


  // Check current password

  const isCurrentPasswordCorrect = await bcrypt.compare(
    currentPassword,
    user.password
  );


  if (!isCurrentPasswordCorrect) {

    const err = new Error("Current password is incorrect");

    err.statusCode = 401;

    throw err;

  }


  // Password length

  if (newPassword.length < 6) {

    const err = new Error(
      "New password must be at least 6 characters"
    );

    err.statusCode = 400;

    throw err;

  }


  // No spaces

  if (/\s/.test(newPassword)) {

    const err = new Error(
      "Password must not contain spaces"
    );

    err.statusCode = 400;

    throw err;

  }


  // Confirm password

  if (newPassword !== confirmPassword) {

    const err = new Error(
      "New password and confirm password do not match"
    );

    err.statusCode = 400;

    throw err;

  }


  // Check whether new password is same as old password

  const samePassword = await bcrypt.compare(
    newPassword,
    user.password
  );


  if (samePassword) {

    const err = new Error(
      "New password must be different from current password"
    );

    err.statusCode = 400;

    throw err;

  }


  // Hash new password

  const hashedPassword = await bcrypt.hash(
    newPassword,
    10
  );


  // Generate separate OTP

  const otp = generateOtp();

  const otpExpiry = new Date(
    Date.now() + 10 * 60 * 1000
  );


  // Store pending password and change-password OTP

  user.pendingPassword = hashedPassword;

  user.changePasswordOtp = otp;

  user.changePasswordOtpExpiry = otpExpiry;


  await userRepositories.saveUser(user);


  // Send OTP to registered email

  await sendOtpEmail(user.email, otp);


  return {

    message: "OTP sent to your registered email",

    email: user.email

  };

};


// ==========================================
// VERIFY CHANGE PASSWORD OTP
// ==========================================

const verifyChangePassword = async (
  userId,
  otp
) => {

  const user = await userRepositories.findById(userId);

  if (!user) {

    const err = new Error("User not found");

    err.statusCode = 404;

    throw err;

  }


  if (!user.changePasswordOtp) {

    const err = new Error(
      "Change password OTP not found"
    );

    err.statusCode = 400;

    throw err;

  }


  // Check OTP

  if (
    String(user.changePasswordOtp) !==
    String(otp)
  ) {

    const err = new Error("Invalid OTP");

    err.statusCode = 400;

    throw err;

  }


  // Check expiry

  if (
    !user.changePasswordOtpExpiry ||
    user.changePasswordOtpExpiry < new Date()
  ) {

    user.changePasswordOtp = undefined;

    user.changePasswordOtpExpiry = undefined;

    user.pendingPassword = undefined;


    await userRepositories.saveUser(user);


    const err = new Error("OTP expired");

    err.statusCode = 400;

    throw err;

  }


  // Set the new password

  user.password = user.pendingPassword;


  // Clear temporary fields

  user.pendingPassword = undefined;

  user.changePasswordOtp = undefined;

  user.changePasswordOtpExpiry = undefined;


  await userRepositories.saveUser(user);


  return {

    message: "Password changed successfully"

  };

};


// ==========================================
// EXPORT SERVICES
// ==========================================

module.exports = {

  registerUser,

  verifyOtp,

  resendOtp,

  verifyForgotPasswordOtp,

  loginUser,

  forgetPassword,

  resetPassword,

  googleLogin,

  updateUserProfile,

  getUserProfile,

  removeProfile,

  verifyChangePassword,

  requestChangePassword

};