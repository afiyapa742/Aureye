
const Offer = require("../models/offer");
const UserOfferProgress = require("../models/userOfferProgress");

const getActiveOffers = async () => {
  const now = new Date();

  const offers = await Offer.find({
    offer_status: "active",
    valid_from: { $lte: now },
    valid_to: { $gte: now },
  })
    .sort({ createdAt: 1, _id: 1 })
    .lean();

  console.log("CURRENT DATE:", now);
  console.log("ACTIVE OFFERS FOUND:", offers.length);
  console.log(
    "ACTIVE OFFER NAMES:",
    offers.map((offer) => offer.offerName)
  );

  return offers;
};

const advanceUserOfferIndex = async (userId) => {
  return UserOfferProgress.findOneAndUpdate(
    { userId },
    { $inc: { nextIndex: 1 } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  ).lean();
};

module.exports = {
  getActiveOffers,
  advanceUserOfferIndex,
};
