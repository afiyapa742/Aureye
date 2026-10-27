const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referal');

const auth = require("../auth/authMiddleware");
 
// Public: signup form checks a code
router.get("/validate/:code", referralController.validateCode);
 
// Logged in only: returns the user's code, link and stats
router.get("/me", auth, referralController.getMyReferral);

module.exports = router;