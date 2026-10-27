import API from "../api/axios";

// ==========================================
// REGISTER
// ==========================================

export const registerAPI = async (formData) => {
  const payload = {
    FullName:
      formData.FullName ||
      formData.fullName ||
      formData.name,

    email: formData.email,

    password: formData.password,

    MobileNumber:
      formData.MobileNumber ||
      formData.mobileNumber ||
      formData.mobile ||
      formData.phone,
  };

  const response = await API.post(
    "/auth/register",
    payload
  );

  return response.data;
};


// ==========================================
// LOGIN
// ==========================================

export const loginAPI = async (credentials) => {
  const response = await API.post(
    "/auth/login",
    credentials
  );

  return response.data;
};


// ==========================================
// VERIFY OTP - SIGNUP
// ==========================================

export const verifyOtpAPI = async (data) => {
  const response = await API.post(
    "/auth/verify-otp",
    data
  );

  return response.data;
};


// ==========================================
// RESEND OTP
// ==========================================

export const resendOtpAPI = async (data) => {
  const response = await API.post(
    "/auth/resend-otp",
    data
  );
  return response.data;
};


// ==========================================
// VERIFY FORGOT PASSWORD OTP
// ==========================================

export const verifyForgotPasswordOtpAPI = async (data) => {
  const response = await API.post(
    "/auth/verify-forgot-password-otp",
    {
      email: data.email,
      otp: data.otp,
    }
  );

  return response.data;
};


// ==========================================
// FORGOT PASSWORD
// ==========================================

export const forgotPasswordAPI = async (data) => {
  const email =
    typeof data === "string"
      ? data.trim()
      : data?.email?.trim();

  if (!email) {
    throw new Error("Email is required");
  }

  const response = await API.post(
    "/auth/forgot-password",
    {
      email,
    }
  );

  return response.data;
};


// ==========================================
// RESET PASSWORD
// ==========================================

export const resetPasswordAPI = async (data) => {
  const response = await API.post(
    "/auth/reset-password",
    {
      email: data.email,
      otp: data.otp,
      newPassword: data.newPassword,
    }
  );

  return response.data;
};


// ==========================================
// GOOGLE LOGIN
// ==========================================

export const googleLogin = async (idToken) => {
  try {
    const response = await API.post(
      "/auth/googlelogin",
      {
        idToken,
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "GOOGLE LOGIN API ERROR:",
      error.response?.data
    );

    throw error;
  }
};

export const googleLoginUrl =
  "http://localhost:5000/api/auth/google";