const addressservice = require("../services/address");

const getAdress = async (req, res) => {
  try {
    const addresses = await addressservice.getAdress(req.user.id);

    res.status(200).json(addresses);

  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.message
    });
  }
};


const addAddress = async (req, res) => {

  try {

    const {
      FullName,
      MobileNumber,
      address,
      landmark,
      district,
      city,
      state,
      pincode,
      addressType,
      isDefault
    } = req.body;


    if (
      !FullName ||
      !MobileNumber ||
      !address ||
      !district ||
      !city ||
      !state ||
      !pincode
    ) {

      return res.status(400).json({
        message: "All required fields must be provided"
      });

    }


    const newAddress =
      await addressservice.CreateNew({

        userId: req.user.id,
        FullName,
        MobileNumber,
        address,
        landmark,
        district,
        city,
        state,
        pincode,
        addressType,
        isDefault

      });


    res.status(201).json(newAddress);


  } catch (error) {

    console.error("ADD ADDRESS ERROR:", error);

    res.status(error.statusCode || 500).json({
      message: error.message
    });

  }

};


const updateAddress = async (req, res) => {

  try {

    const { addressId } = req.params;

    if (!addressId) {

      return res.status(400).json({
        message: "Address ID parameter is required"
      });

    }

    const updatedAddress =
      await addressservice.updateAddress(
        addressId,
        req.user.id,
        req.body
      );

    res.status(200).json(updatedAddress);

  } catch (error) {

    res.status(error.statusCode || 500).json({
      message: error.message
    });

  }

};


const deleteAddress = async (req, res) => {

  try {

    const { addressId } = req.params;

    if (!addressId) {

      return res.status(400).json({
        message: "Address ID parameter is required"
      });

    }

    const result =
      await addressservice.deleteAddress(
        addressId,
        req.user.id
      );

    res.status(200).json(result);

  } catch (error) {

    res.status(error.statusCode || 500).json({
      message: error.message
    });

  }

};
const editAdress = async (req, res) => {

  try {

    const { addressId } = req.body;

    if (!addressId) {
      return res.status(400).json({
        message: "Address ID is required"
      });
    }

  } catch (error) {

    return res.status(500).json({
      message: error.message
    });

  }

};
module.exports = { 
  getAdress,
  addAddress,
  updateAddress,
  deleteAddress
};