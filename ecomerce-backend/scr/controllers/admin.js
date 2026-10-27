const {
  loginAdmin,
  getAdminprofile,
  Adminupdateprofile,
  Userdetail,
  changeUserStatus,
  deleteuser
} = require("../services/admin");


// ==========================
// LOGIN
// ==========================

const adminLogin = async (req, res) => {

  try {

    const { email, password } = req.body;

    const admin = await loginAdmin(
      email,
      password
    );

    return res.status(200).json({
      message: "Admin login successful",
      admin
    });

  } catch (error) {

    return res.status(401).json({
      message: error.message
    });

  }

};


// ==========================
// GET PROFILE
// ==========================

const getprofile = async (req, res) => {

  try {

    const { id } = req.params;

    const admin = await getAdminprofile(id);

    return res.status(200).json({
      message: "Admin profile fetched successfully",
      admin
    });

  } catch (error) {

    return res.status(404).json({
      message: error.message
    });

  }

};


// ==========================
// UPDATE PROFILE IMAGE
// ==========================

const updateadminimage = async (req, res) => {

  try {

    const { id } = req.params;

    const { profileImage } = req.body;

    if (!profileImage) {

      return res.status(400).json({
        message: "Profile image is required"
      });

    }

    const admin = await Adminupdateprofile(
      id,
      profileImage
    );

    return res.status(200).json({
      message: "Profile image updated successfully",
      admin
    });

  } catch (error) {

    return res.status(400).json({
      message: error.message
    });

  }

};


// ==========================
// GET ALL USERS
// ==========================

const getAlluser = async (req, res) => {

  try {

    const users = await Userdetail();

    return res.status(200).json({
      message: "Users fetched successfully",
      users
    });

  } catch (error) {

    console.log(
      "GET USERS ERROR:",
      error
    );

    return res.status(500).json({
      message: error.message
    });

  }

};


// ==========================
// BLOCK / UNBLOCK USER
// ==========================

const updateUserStatus = async (req, res) => {

  try {

    const { id } = req.params;

    const { status } = req.body;

    const user = await changeUserStatus(
      id,
      status
    );

    return res.status(200).json({
      message: "User status updated successfully",
      user
    });

  } catch (error) {

    console.log(
      "UPDATE USER STATUS ERROR:",
      error
    );

    return res.status(400).json({
      message: error.message
    });

  }

};


// ==========================
// DELETE USER
// ==========================

const userdelete = async (req, res) => {

  try {

    const { id } = req.params;

    console.log(
      "Controller delete ID:",
      id
    );

    const user = await deleteuser(id);

    return res.status(200).json({
      message: "Successfully deleted",
      user
    });

  } catch (error) {

    console.log(
      "DELETE USER ERROR:",
      error
    );

    return res.status(500).json({
      message: error.message
    });

  }

};


// ==========================
// EXPORT
// ==========================

module.exports = {

  adminLogin,
  getprofile,
  updateadminimage,
  getAlluser,
  updateUserStatus,
  userdelete

};