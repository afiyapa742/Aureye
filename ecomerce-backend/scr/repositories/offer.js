const Offer = require("../models/offer");

const createOffer = async (data) => {
  return await Offer.create(data);
};

const getActiveCommonOffer = async () => {
  return await Offer.findOne({
    offerType: "common",
    offer_status: "active",
    valid_from: { $lte: new Date() },
    valid_to: { $gte: new Date() },
  }).sort({ createdAt: -1 });
};

const getActiveCategoryOffer = async (categoryId) => {
  return await Offer.findOne({
    offerType: "category",
    categoryId: categoryId,
    offer_status: "active",
    valid_from: { $lte: new Date() },
    valid_to: { $gte: new Date() },
  })
    .populate("categoryId")
    .sort({ createdAt: -1 });
};

const getActiveProductOffer = async (productId) => {
  return await Offer.findOne({
    offerType: "product",
    productId: productId,
    offer_status: "active",
    valid_from: { $lte: new Date() },
    valid_to: { $gte: new Date() },
  })
    .populate("productId")
    .sort({ createdAt: -1 });
};

const getUpcomingCommonOffer = async () => {
  return Offer.findOne({
    offerType: "common",
    offer_status: "active",
    valid_from: { $gt: new Date() },
  }).sort({ valid_from: 1 });
};

const getUpcomingCategoryOffer = async (categoryId) => {
  return Offer.findOne({
    offerType: "category",
    categoryId: categoryId,
    offer_status: "active",
    valid_from: { $gt: new Date() },
  })
    .populate("categoryId")
    .sort({ valid_from: 1 });
};

const getUpcomingProductOffer = async (productId) => {
  return Offer.findOne({
    offerType: "product",
    productId: productId,
    offer_status: "active",
    valid_from: { $gt: new Date() },
  })
    .populate("productId")
    .sort({ valid_from: 1 });
};

const getAllOffers = async () => {
  return await Offer.find()
    .populate("productId")
    .populate("categoryId")
    .sort({ createdAt: -1 });
};

const getOfferById = async (id) => {
  return await Offer.findById(id)
    .populate("productId")
    .populate("categoryId");
};

const updateOffer = async (id, data) => {
  return await Offer.findByIdAndUpdate(
    id,
    data,
    {
      new: true,
      runValidators: true,
    }
  );
};

const deleteOffer = async (id) => {
  return await Offer.findByIdAndDelete(id);
};

module.exports = {
  createOffer,
  getAllOffers,
  getOfferById,
  updateOffer,
  deleteOffer,

  getActiveCommonOffer,
  getActiveCategoryOffer,
  getActiveProductOffer,

  getUpcomingCommonOffer,
  getUpcomingCategoryOffer,
  getUpcomingProductOffer,
};