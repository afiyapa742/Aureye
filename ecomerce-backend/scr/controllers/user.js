const authService = require("../services/user");

// ==========================================
// REGISTER
// ==========================================
const registerUser = async (req, res) => {
  try {
    const {
      FullName,
      email,
      password,
      MobileNumber,
      referralCode,
    } = req.body;

    if (!FullName || !email || !password || !MobileNumber) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const result = await authService.registerUser({
      FullName,
      email,
      password,
      MobileNumber,
      referralCode: referralCode
        ? String(referralCode).trim().toUpperCase()
        : undefined,
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Registration failed",
    });
  }
};

// ==========================================
// VERIFY OTP
// ==========================================

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required",
      });
    }

    const result = await authService.verifyOtp({
      email,
      otp,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);

    res.status(error.statusCode || 500).json({
      message: error.message || "OTP verification failed",
    });
  }
};

// ==========================================
// RESEND OTP
// ==========================================

const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const result = await authService.resendOtp({
      email,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("RESEND OTP ERROR:", error);

    res.status(error.statusCode || 500).json({
      message: error.message || "Failed to resend OTP",
    });
  }
};

// ==========================================
// LOGIN
// ==========================================

const loginUser = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const result = await authService.loginUser({
      email,
      password,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    res.status(error.statusCode || 500).json({
      message: error.message || "Login failed",
    });
  }
};

// ==========================================
// GOOGLE LOGIN
// ==========================================

const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        message: "Google ID token is required",
      });
    }

    const result = await authService.googleLogin({
      idToken,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("GOOGLE LOGIN ERROR:", error);

    res.status(error.statusCode || 500).json({
      message: error.message || "Google login failed",
    });
  }
};

// ==========================================
// FORGOT PASSWORD
// ==========================================

const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const result = await authService.forgetPassword({
      email,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);

    res.status(error.statusCode || 500).json({
      message: error.message || "Forgot password failed",
    });
  }
};

// ==========================================
// RESET PASSWORD
// ==========================================

const resetPassword = async (req, res) => {
  try {
    const {
      email,
      otp,
      newPassword,
    } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        message: "Email, OTP and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const result = await authService.resetPassword({
      email,
      otp,
      newPassword,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);

    res.status(error.statusCode || 500).json({
      message: error.message || "Password reset failed",
    });
  }
};
const verifyForgotPasswordOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required",
      });
    }

    const result =
      await authService.verifyForgotPasswordOtp({
        email,
        otp,
      });

    res.status(200).json(result);

  } catch (error) {
    console.error(
      "VERIFY FORGOT PASSWORD OTP ERROR:",
      error
    );

    res.status(error.statusCode || 500).json({
      message:
        error.message ||
        "OTP verification failed",
    });
  }
};

//update profilr//

const updateProfile = async (req, res) => {

  try {

    const { profileImage } = req.body;

    if (!profileImage) {

      return res.status(400).json({
        message: "Profile image is required"
      });

    }

    const userId = req.user.id;

    const user =
      await authService.updateUserProfile(
        userId,
        profileImage
      );

    return res.status(200).json({

      message: "Profile image updated successfully",

      user

    });

  } catch (error) {

    console.error(
      "PROFILE IMAGE UPDATE ERROR:",
      error
    );

    return res.status(
      error.statusCode || 500
    ).json({

      message:
        error.message ||
        "Failed to update profile"

    });

  }

};

const getProfile = async (req, res) => {

  try {

    const userId = req.user.id;

    const user =
      await authService.getUserProfile(userId);

    return res.status(200).json(user);

  } catch (error) {

    console.error(
      "GET PROFILE ERROR:",
      error
    );

    return res.status(500).json({
      message: error.message
    });

  }

};


//remove profile//
const RemoveProfile = async (req, res) => {

  try {

    const userId = req.user.id;

    const user = await authService.removeProfile(userId);

    return res.status(200).json({
      message: "Profile photo removed successfully",
      user
    });

  } catch (error) {

    console.error("REMOVE PROFILE ERROR:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Failed to remove profile photo"
    });

  }
};
const verifyChangePassword = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        message: "OTP is required",
      });
    }

    const userId = req.user.id;

    const result = await authService.verifyChangePassword(
      userId,
      otp
    );

    return res.status(200).json(result);

  } catch (error) {
    console.error("VERIFY CHANGE PASSWORD ERROR:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "OTP verification failed",
    });
  }
};
const requestChangePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "All password fields are required",
      });
    }

    const userId = req.user.id;

    const result = await authService.requestChangePassword(
      userId,
      currentPassword,
      newPassword,
      confirmPassword
    );

    return res.status(200).json(result);

  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Failed to change password",
    });
  }
};
// ==========================================
// EXPORT
// ==========================================

module.exports = {
  registerUser,
  verifyOtp,
  resendOtp,
  loginUser,
  googleLogin,
  forgetPassword,
  resetPassword,
  verifyForgotPasswordOtp,
  updateProfile ,
  getProfile,
  RemoveProfile,
  requestChangePassword,
  verifyChangePassword
};