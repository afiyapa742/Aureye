const {
  GetTrack,
} = require("../services/trackorder");

const getTrack = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;

    const result = await GetTrack(orderId, itemId);

    return res.status(200).json({
      message: "Order tracking details fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error("GET TRACK ORDER ERROR:", error);

    return res.status(500).json({
      message: error.message || "Unable to fetch order tracking details",
    });
  }
};

module.exports = {
  getTrack,
};