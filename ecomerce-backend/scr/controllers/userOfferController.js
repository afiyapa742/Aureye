
const userOfferService = require("../services/userOfferService");

const getNextOfferForUser = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    const offer =
      await userOfferService.getNextOfferForUser(userId);

    return res.status(200).json({
      success: true,
      data: { offer },
    });
  } catch (error) {
    console.error("Get next offer error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.statusCode === 401
          ? error.message
          : "Unable to fetch the next offer.",
    });
  }
};

module.exports = {
  getNextOfferForUser,
};
