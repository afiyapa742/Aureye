const {
  Getvarient,
  Addvarient,
  Editvarient,
  Deletevarient
} = require("../services/productvarient");

const getVarient = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 100;

    const skip = (page - 1) * limit;

    const data = {};

    if (req.query.productId) {
      data.productId = req.query.productId;
    }

    console.log("VARIANT FILTER:", data);

    const product = await Getvarient(
      data,
      skip,
      limit
    );

    return res.status(200).json({
      message: "Product variant fetched successfully",
      data: product
    });

  } catch (error) {
    console.error(
      "GET VARIENT ERROR:",
      error
    );

    return res.status(400).json({
      message: error.message
    });
  }
};
const addVarient = async (req, res) => {
  try {
    const data = req.body;

    data.productImages = req.files
      ? req.files.map((file) => ({
          imageUrl: file.filename
        }))
      : [];

    const product = await Addvarient(data);

    return res.status(201).json({
      message: "Product variant added successfully",
      data: product
    });

  } catch (error) {
    console.error("ADD VARIENT ERROR:", error);

    return res.status(400).json({
      message: error.message
    });
  }
};

const editVarient = async (req, res) => {
  try {
    const { id } = req.params;

    const data = req.body;

    // If new images are uploaded
    if (req.files && req.files.length > 0) {
      data.productImages = req.files.map((file) => ({
        imageUrl: file.filename
      }));
    }

    const product = await Editvarient(id, data);

    return res.status(200).json({
      message: "Product variant updated successfully",
      data: product
    });

  } catch (error) {
    console.error(
      "EDIT VARIENT ERROR:",
      error
    );

    return res.status(400).json({
      message: error.message
    });
  }
};

const deleteVarient = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Deletevarient(id);

    return res.status(200).json({
      message: "Product variant deleted successfully",
      data: product
    });

  } catch (error) {
    console.error("DELETE VARIENT ERROR:", error);

    return res.status(400).json({
      message: error.message
    });
  }
};

module.exports = {
  getVarient,
  addVarient,
  editVarient,
  deleteVarient
};