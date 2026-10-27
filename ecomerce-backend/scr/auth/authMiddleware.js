const { verifyToken } = require("../utils/generateToken");
const User = require("../models/user");

const protect = async (req, res, next) => {
  console.log("========== AUTH CHECK ==========");
  console.log("AUTH HEADER:", req.headers.authorization);

  const authHeader = req.headers.authorization;

  if (
    !authHeader ||
    !authHeader.startsWith("Bearer ")
  ) {
    console.log("❌ TOKEN MISSING");

    return res.status(401).json({
      message: "Not authorized, no token"
    });
  }

  const token = authHeader.split(" ")[1];

  console.log(
    "TOKEN RECEIVED:",
    token ? "YES" : "NO"
  );

  try {
    const decoded = verifyToken(token);

    console.log("✅ TOKEN VERIFIED");

    const user = await User.findById(decoded.id);

    if (!user) {
      console.log("❌ USER NOT FOUND");

      return res.status(401).json({
        message: "User not found"
      });
    }

    // ONLY THIS PART CHANGED
    console.log(
      "USER STATUS:",
      user.status
    );

    if (user.status === "BLOCKED") {
      console.log("🚫 USER IS BLOCKED");

      return res.status(403).json({
        message:
          "Your account has been blocked by the admin"
      });
    }

    req.user = decoded;

    next();

  } catch (error) {
    console.error(
      "❌ TOKEN VERIFY ERROR:",
      error
    );

    return res.status(401).json({
      message:
        "Not authorized, token failed"
    });
  }
};

module.exports = protect;