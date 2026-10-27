const referralService = require('../services/referal');

// Reads the logged-in user's id from the session.
// Change this one line if your session stores the user differently.
const getUserId = (req) =>
  req.session?.user?._id || req.session?.user?.id || req.session?.userId;

const getBaseUrl = (req) => `${req.protocol}://${req.get('host')}`;

// GET /referral  -> server-rendered EJS page
exports.getReferralPage = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.redirect('/login');

    const overview = await referralService.getReferralOverview(userId, getBaseUrl(req));
    if (!overview) return res.redirect('/login');

    res.render('user/profile/referral', { user: req.session.user, ...overview });
  } catch (err) {
    console.error('getReferralPage error:', err);
    res.status(500).send('Something went wrong');
  }
};


exports.getMyReferral = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: 'Not logged in' });

    const overview = await referralService.getReferralOverview(userId, getBaseUrl(req));
    if (!overview) return res.status(401).json({ success: false, message: 'Not logged in' });

    res.json({ success: true, ...overview });
  } catch (err) {
    console.error('getMyReferral error:', err);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

// GET /referral/validate/:code  -> used by the signup form (public)
exports.validateCode = async (req, res) => {
  try {
    const referrer = await referralService.findReferrerByCode(req.params.code);
    if (!referrer) return res.json({ valid: false, message: 'Invalid referral code' });

    res.json({ valid: true, message: 'Referral code applied' });
  } catch (err) {
    console.error('validateCode error:', err);
    res.status(500).json({ valid: false, message: 'Server error' });
  }
};