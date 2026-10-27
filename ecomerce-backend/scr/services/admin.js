const {
  findemail,
  findAdminid,
  Adminupdate,
  FindAll,
  findoneupdate,
  deleteUser
} = require("../repositories/Adminrepositories");

const bcrypt = require("bcrypt");


// ==========================
// ADMIN LOGIN
// ==========================

const loginAdmin = async (email, password) => {

  const admin = await findemail(email);

  if (!admin) {
    throw new Error("Admin not found");
  }

  const passwordMatch = await bcrypt.compare(
    password,
    admin.password
  );

  if (!passwordMatch) {
    throw new Error("Password is incorrect");
  }

  return admin;
};


// ==========================
// GET ADMIN PROFILE
// ==========================

const getAdminprofile = async (id) => {

  const admin = await findAdminid(id);

  if (!admin) {
    throw new Error("Admin not found");
  }

  return admin;
};


// ==========================
// UPDATE ADMIN PROFILE
// ==========================

const Adminupdateprofile = async (
  id,
  profileImage
) => {

  const admin = await findAdminid(id);

  if (!admin) {
    throw new Error("Admin not found");
  }

  const updatedAdmin = await Adminupdate(
    id,
    {
      profileImage: profileImage
    }
  );

  return updatedAdmin;
};


// ==========================
// GET ALL USERS
// ==========================

const Userdetail = async () => {

  const user = await FindAll();

  return user;
};


// ==========================
// BLOCK / UNBLOCK
// ==========================

const changeUserStatus = async (id, status) => {

  if (!["ACTIVE", "BLOCKED"].includes(status)) {

    throw new Error("Invalid user status");

  }

  const user = await findoneupdate(
    id,
    status
  );

  if (!user) {

    throw new Error("User not found");

  }

  return user;
};


// ==========================
// DELETE USER
// ==========================

const deleteuser = async (id) => {

  console.log("Service delete ID:", id);

  const user = await deleteUser(id);

  if (!user) {

    throw new Error("User not found");

  }

  return user;
};


// ==========================
// EXPORT
// ==========================

module.exports = {

  loginAdmin,
  getAdminprofile,
  Adminupdateprofile,
  Userdetail,
  changeUserStatus,
  deleteuser

};