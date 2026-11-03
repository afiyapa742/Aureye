const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    FullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
    },

    MobileNumber: {
      type: String,
      unique: true,
      sparse: true,
    },

    profileImage: {
      type: String,
    },

    AuthProvider: {
      type: String,
      enum: ["LOCAL", "GOOGLE"],
      default: "LOCAL",
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "BLOCKED"],
      default: "ACTIVE",
    },

    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isVerified: {
  type: Boolean,
  default: false,
},
otp: {
  type: String,
},
otpExpiry: {
  type: Date,
},
changePasswordOtp: {
  type: String,
},

changePasswordOtpExpiry: {
  type: Date,
},

pendingPassword: {
  type: String,
},
pendingEmail: {
  type: String,
  lowercase: true,
  trim: true,
},
emailChangeOtp: {
  type: String,
},
emailChangeOtpExpiry: {
  type: Date,
},
// recommended for the hardening I suggested
emailChangeOtpAttempts: {
  type: Number,
  default: 0,
},
emailChangeOtpSentAt: {
  type: Date,
},
  },
  {
    timestamps: true,
  }
);

const user = mongoose.model("user",userSchema);
module.exports = user;


