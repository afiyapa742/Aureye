const bcrypt = require("bcrypt");
const Admin = require("./scr/models/Admindb");

const createAdmin = async () => {
  try {
    const existingAdmin = await Admin.findOne({
      email: process.env.ADMIN_EMAIL,
    });

    if (existingAdmin) {
      console.log("Admin already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash(
      process.env.ADMIN_PASSWORD,
      10
    );

    await Admin.create({
      id: "ADM001",
      email: process.env.ADMIN_EMAIL,
      password: hashedPassword,
        profileImage: ""
    });

    console.log("Admin created successfully");
  } catch (error) {
    console.error("Admin creation failed:", error.message);
  }
};

module.exports = createAdmin;