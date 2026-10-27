const JWT = require("jsonwebtoken");


// ==========================================
// GENERATE TOKEN
// ==========================================

const generateToken = (id) => {

  return JWT.sign(
    { id },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d"
    }
  );

};


// ==========================================
// VERIFY TOKEN
// ==========================================

const verifyToken = (token) => {

  return JWT.verify(
    token,
    process.env.JWT_SECRET
  );

};


// ==========================================
// EXPORT
// ==========================================

module.exports = generateToken;

module.exports.verifyToken = verifyToken;