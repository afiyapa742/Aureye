const Address = require("../models/adress");


const findAllByUserId = async (userid) => {

  return await Address.find({
    userId: userid
  });

};


const findById = async (addressId) => {

  return await Address.findById(addressId);

};


const create = async (addressdata) => {

  return await Address.create(addressdata);

};


const update = async (addressId, updateData) => {
  return await Address.findByIdAndUpdate(
    addressId,
    updateData,
    {
      new: true,
      runValidators: true
    }
  );
};

const deletebyId = async (addressId) => {

  return await Address.findByIdAndDelete(addressId);

};


const unsetDefaultForUser = async (userId) => {

  return await Address.updateMany(
    {
      userId,
      isDefault: true
    },
    {
      isDefault: false
    }
  );

};


module.exports = {
  findAllByUserId,
  findById,
  create,
  update,
  deletebyId,
  unsetDefaultForUser
};