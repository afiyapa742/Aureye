const offerRepository = require("../repositories/offer");

const createOffer = async (data) => {
  const {
    productId,
    categoryId,
    offerName,
    offerType,
    discounttype,
    discountvalue,
    valid_from,
    valid_to,
    description,
    offer_status,
  } = data;

  if (!offerName) {
    throw new Error("Offer name is required");
  }

  if (!offerType) {
    throw new Error("Offer type is required");
  }

  if (offerType === "product" && !productId) {
    throw new Error("Product is required for product offer");
  }

  if (offerType === "category" && !categoryId) {
    throw new Error("Category is required for category offer");
  }

  if (!discounttype) {
    throw new Error("Discount type is required");
  }

  if (discountvalue === undefined || discountvalue === null) {
    throw new Error("Discount value is required");
  }

  if (!valid_from || !valid_to) {
    throw new Error("Offer validity dates are required");
  }

  if (new Date(valid_from) >= new Date(valid_to)) {
    throw new Error("Valid to date must be after valid from date");
  }

  if (
    discounttype === "percentage" &&
    Number(discountvalue) > 100
  ) {
    throw new Error("Percentage discount cannot exceed 100");
  }

  return await offerRepository.createOffer({
    productId: offerType === "product" ? productId : null,
    categoryId: offerType === "category" ? categoryId : null,
    offerName,
    offerType,
    discounttype,
    discountvalue,
    valid_from,
    valid_to,
    description,
    offer_status: offer_status || "active",
  });
};

const getAllOffers = async () => {
  return await offerRepository.getAllOffers();
};

const getOfferById = async (id) => {
  const offer = await offerRepository.getOfferById(id);

  if (!offer) {
    throw new Error("Offer not found");
  }

  return offer;
};

const updateOffer = async (id, data) => {
  const existingOffer = await offerRepository.getOfferById(id);

  if (!existingOffer) {
    throw new Error("Offer not found");
  }

  if (
    data.valid_from &&
    data.valid_to &&
    new Date(data.valid_from) >= new Date(data.valid_to)
  ) {
    throw new Error("Valid to date must be after valid from date");
  }

  if (
    data.discounttype === "percentage" &&
    Number(data.discountvalue) > 100
  ) {
    throw new Error("Percentage discount cannot exceed 100");
  }

  return await offerRepository.updateOffer(id, data);
};

const deleteOffer = async (id) => {
  const existingOffer = await offerRepository.getOfferById(id);

  if (!existingOffer) {
    throw new Error("Offer not found");
  }

  return await offerRepository.deleteOffer(id);
};


/* ================================
   GET ACTIVE / UPCOMING OFFER
================================ */


const getActiveOffer = async (categoryId, productId) => {
  let offer = null;

  // 1. Product page: matching active product offer
  if (productId) {
    offer = await offerRepository.getActiveProductOffer(productId);
  }

  // 2. Category page: matching active category offer
  if (!offer && categoryId) {
    offer = await offerRepository.getActiveCategoryOffer(categoryId);
  }

  // 3. Fallback: common active offer
  if (!offer) {
    offer = await offerRepository.getActiveCommonOffer();
  }

  return offer || null;
};



module.exports = {
  createOffer,
  getAllOffers,
  getOfferById,
  updateOffer,
  deleteOffer,
  getActiveOffer,
};