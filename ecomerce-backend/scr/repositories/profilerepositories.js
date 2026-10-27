const User = require("../models/user");

const findById = async (userId) => {
  return await User.findById(userId)
    .select("-password -otp -otpExpiry");
};

const findByEmail = async (email) => {
  return await User.findOne({ email });
};

const updateById = async (userId, updates) => {
  return await User.findByIdAndUpdate(
    userId,
    updates,
    {
      new: true,
      runValidators: true,
    }
  ).select("-password -otp -otpExpiry");
};

const updateemail = async (id, email) => {
  return await User.findByIdAndUpdate(
    id,
    {
      email: email,
      isVerified: true,
    },
    {
      returnDocument: "after",
      runValidators: true,
    }
  ).select("-password -otp -otpExpiry");
};

module.exports = {
  findById,
  findByEmail,
  updateById,
  updateemail,
};