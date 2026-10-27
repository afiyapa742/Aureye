const referralRepository = require('../repositories/referal');
const generateReferralCode = require('../utils/genreferalcode');

const REFERRER_REWARD = 100; // credited to the person who shared the code
const REFEREE_REWARD = 50;   // credited to the new user

/** Give a user a unique referral code (no-op if they already have one). */
async function ensureReferralCode(user) {
  if (user.referralCode) return user.referralCode;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateReferralCode();
    try {
      const updated = await referralRepository.setReferralCodeIfMissing(user._id, code);
      if (updated) return updated.referralCode;
      // another request set it first
      const fresh = await referralRepository.getReferralCodeOfUser(user._id);
      return fresh.referralCode;
    } catch (err) {
      if (err.code === 11000) continue; // collision, try another code
      throw err;
    }
  }
  throw new Error('Could not generate a unique referral code');
}

/** Returns the referrer if the code is valid, otherwise null. */
async function findReferrerByCode(rawCode) {
  if (!rawCode) return null;
  const code = String(rawCode).trim().toUpperCase();
  return referralRepository.findUserByReferralCode(code);
}

/**
 * Call right after a new user is created at signup.
 * Returns { ok: true } or { ok: false, message }.
 */
async function applyReferral(newUser, rawCode) {
  const referrer = await findReferrerByCode(rawCode);
  if (!referrer) return { ok: false, message: 'Invalid referral code' };

  if (String(referrer._id) === String(newUser._id)) {
    return { ok: false, message: 'You cannot use your own referral code' };
  }
  if (newUser.referredBy) {
    return { ok: false, message: 'A referral code was already applied' };
  }

  try {
    await referralRepository.createReferral({
      referrer: referrer._id,
      referee: newUser._id,
      code: referrer.referralCode,
    });
  } catch (err) {
    if (err.code === 11000) return { ok: false, message: 'A referral code was already applied' };
    throw err;
  }

  await referralRepository.setReferredBy(newUser._id, referrer._id);
  return { ok: true };
}

/**
 * Call when the referred user's FIRST order is delivered/paid.
 * The status flip is atomic, so rewards can never be paid twice.
 */
async function rewardReferral(refereeId) {
  const referral = await referralRepository.markRewarded(refereeId, REFERRER_REWARD, REFEREE_REWARD);
  if (!referral) return null; // not referred, or already rewarded

  await referralRepository.creditWallet(referral.referrer, REFERRER_REWARD, 'Referral reward');
  await referralRepository.creditWallet(referral.referee, REFEREE_REWARD, 'Welcome reward (referral)');
  return referral;
}

async function getReferralStats(userId) {
  const referrals = await referralRepository.findByReferrer(userId);
  return {
    total: referrals.length,
    rewarded: referrals.filter((r) => r.status === 'rewarded').length,
    earned: referrals.reduce((sum, r) => sum + (r.referrerReward || 0), 0),
    referrals,
  };
}

/** Everything the referral page needs, in one object. */
async function getReferralOverview(userId, baseUrl) {
  const user = await referralRepository.findUserById(userId);
  if (!user) return null;

  const code = await ensureReferralCode(user);
  const stats = await getReferralStats(user._id);

  return {
    code,
    link: `${baseUrl}/signup?ref=${code}`,
    referrerReward: REFERRER_REWARD,
    refereeReward: REFEREE_REWARD,
    stats,
  };
}

module.exports = {
  REFERRER_REWARD,
  REFEREE_REWARD,
  ensureReferralCode,
  findReferrerByCode,
  applyReferral,
  rewardReferral,
  getReferralStats,
  getReferralOverview,
};