// All database access for the referral feature lives here.
const User = require("../models/user");
const Referral = require("../models/referal");
const Wallet = require("../models/wallet");

/* ---------- User (referral fields only) ---------- */

const findUserById = (id) => User.findById(id);

const findUserByReferralCode = (code) =>
  User.findOne({ referralCode: code }).select('_id FullName referralCode');

// Sets the code only if the user doesn't have one yet (race-safe).
// Throws error code 11000 if the code is already taken by someone else.
const setReferralCodeIfMissing = (userId, code) =>
  User.findOneAndUpdate(
    {
      _id: userId,
      $or: [
        { referralCode: { $exists: false } },
        { referralCode: null },
        { referralCode: '' },
      ],
    },
    { $set: { referralCode: code } },
    { new: true }
  );

const getReferralCodeOfUser = (userId) => User.findById(userId).select('referralCode');

const setReferredBy = (userId, referrerId) =>
  User.updateOne({ _id: userId }, { $set: { referredBy: referrerId } });

/* ---------- Referral ---------- */

const createReferral = (data) => Referral.create(data);

// Atomic pending -> rewarded flip. Returns null if nothing to reward.
const markRewarded = (refereeId, referrerReward, refereeReward) =>
  Referral.findOneAndUpdate(
    { referee: refereeId, status: 'pending' },
    {
      $set: {
        status: 'rewarded',
        referrerReward,
        refereeReward,
        rewardedAt: new Date(),
      },
    },
    { new: true }
  );

const findByReferrer = (referrerId) =>
  Referral.find({ referrer: referrerId })
    .populate('referee', 'FullName createdAt')
    .sort({ createdAt: -1 })
    .lean();

/* ---------- Wallet ---------- */

const creditWallet = (userId, amount, note) =>
  Wallet.findOneAndUpdate(
    { user: userId },
    {
      $inc: { balance: amount },
      $push: { transactions: { type: 'credit', amount, note, date: new Date() } },
    },
    { upsert: true, new: true }
  );

module.exports = {
  findUserById,
  findUserByReferralCode,
  setReferralCodeIfMissing,
  getReferralCodeOfUser,
  setReferredBy,
  createReferral,
  markRewarded,
  findByReferrer,
  creditWallet,
};