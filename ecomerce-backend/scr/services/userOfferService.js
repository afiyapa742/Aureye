
const userOfferRepository = require("../repositories/userOfferController");

const getNextOfferForUser = async (userId) => {
  if (!userId) {
    const error = new Error("User ID is required");
    error.statusCode = 401;
    throw error;
  }

  const offers = await userOfferRepository.getActiveOffers();

  if (!offers || offers.length === 0) {
    console.log("No active offers available for the current date.");
    return null;
  }

  const progress =
    await userOfferRepository.advanceUserOfferIndex(userId);

  const nextIndex = Number(progress?.nextIndex) || 1;
  const index = (nextIndex - 1) % offers.length;
  const selectedOffer = offers[index];

  console.log("SELECTED OFFER:", selectedOffer.offerName);

 
return {
  id: selectedOffer._id,
  title: selectedOffer.offerName,

  // Required for SHOP NOW navigation
  offerType: selectedOffer.offerType,
  productId: selectedOffer.productId || null,
  categoryId: selectedOffer.categoryId || null,

  description: selectedOffer.description || "",
  image: selectedOffer.image || "",
  discountType: selectedOffer.discounttype,
  discountValue: selectedOffer.discountvalue,
  link: "/shop",
};

};

module.exports = {
  getNextOfferForUser,
};
