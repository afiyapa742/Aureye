const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema(
  {
    referrer: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true, index: true },
    // One user can only ever be referred once
    referee: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true, unique: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    status: { type: String, enum: ['pending', 'rewarded'], default: 'pending', index: true },
    referrerReward: { type: Number, default: 0 },
    refereeReward: { type: Number, default: 0 },
    rewardedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Referral', referralSchema);