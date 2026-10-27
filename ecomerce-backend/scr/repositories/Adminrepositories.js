const Admin = require("../models/Admindb");
const User = require("../models/user");


// ==========================
// FIND ADMIN BY EMAIL
// ==========================

const findemail = async (email) => {

  return await Admin.findOne({ email });

};


// ==========================
// FIND ADMIN BY ID
// ==========================

const findAdminid = async (id) => {

  return await Admin.findOne({ id });

};


// ==========================
// UPDATE ADMIN
// ==========================

const Adminupdate = async (id, data) => {

  return await Admin.findOneAndUpdate(
    { id: id },
    data,
    { returnDocument: "after" }
  );

};


// ==========================
// GET ALL USERS
// ==========================

const FindAll = async () => {

  return await User.find()
    .select("-password -otp -otpExpiry");

};


// ==========================
// BLOCK / UNBLOCK USER
// ==========================

const findoneupdate = async (id, status) => {
  return await User.findByIdAndUpdate(
    id,
    {
      status: status
    },
    {
      $regex:"",
      $option:""
    },
    {
      new: true,
      runValidators: true
    }
  ).select("-password -otp -otpExpiry");
};

// ==========================
// DELETE USER
// ==========================

const deleteUser = async (id) => {

  console.log("Repository delete ID:", id);

  return await User.findByIdAndDelete(id);

};
//user is block in user side//


// ==========================
// EXPORT
// ==========================

module.exports = {

  findemail,
  findAdminid,
  Adminupdate,
  FindAll,
  findoneupdate,
  deleteUser

};