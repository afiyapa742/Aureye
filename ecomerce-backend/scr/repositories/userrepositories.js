const User =  require("../models/user");

const findByEmail = async (email) => {
  return await User.findOne({ email });
};

const findById = async (id) => {
  return await User.findById(id);
};

const createUser = async (userData) => {
  return await User.create(userData);
};

const saveUser = async (userDoc) => {
  return await userDoc.save();
};

const updateProfile = async (id, data) => {

  return await User.findByIdAndUpdate(
    id,
    data,
    {
      returnDocument:"after"
    }
  ).select("-password -otp -otpExpiry");

};

const Signgoogle = async(googleId)=>{
   return await User.findOne({googleId})
}
const updateById = async (id, data) => {
  return await User.findByIdAndUpdate(
    id,
    data,
    { new: true }
  );
};
module.exports = {
  findByEmail,
  findById,
  createUser,
  saveUser,
  updateProfile,
  Signgoogle,
  updateById
};