const offerService = require("../services/offer");

const createOffer = async (req, res) => {
  try {
    const offer = await offerService.createOffer(req.body);

    res.status(201).json({
      success: true,
      message: "Offer created successfully",
      data: offer,
    });
  } catch (error) {
    console.error("Create offer error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllOffers = async (req, res) => {
  try {
    const offers = await offerService.getAllOffers();

    res.status(200).json({
      success: true,
      data: offers,
    });
  } catch (error) {
    console.error("Get offers error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getOfferById = async (req, res) => {
  try {
    const offer = await offerService.getOfferById(req.params.id);

    res.status(200).json({
      success: true,
      data: offer,
    });
  } catch (error) {
    console.error("Get offer error:", error);

    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const updateOffer = async (req, res) => {
  try {
    const offer = await offerService.updateOffer(
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Offer updated successfully",
      data: offer,
    });
  } catch (error) {
    console.error("Update offer error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteOffer = async (req, res) => {
  try {
    await offerService.deleteOffer(req.params.id);

    res.status(200).json({
      success: true,
      message: "Offer deleted successfully",
    });
  } catch (error) {
    console.error("Delete offer error:", error);

    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const getActiveOffer = async (req, res) => {
  try {
    const { categoryId, productId } = req.query;

    console.log("========== OFFER REQUEST ==========");
    console.log("CATEGORY ID:", categoryId);
    console.log("PRODUCT ID:", productId);

    const offer = await offerService.getActiveOffer(
      categoryId,
      productId
    );

    console.log("SELECTED OFFER:", offer);
    console.log("===================================");

    res.status(200).json({
      success: true,
      data: offer,
    });
  } catch (error) {
    console.error("Get active offer error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createOffer,
  getAllOffers,
  getOfferById,
  updateOffer,
  deleteOffer,
  getActiveOffer,
};