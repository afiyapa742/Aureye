const addressrepository = require("../repositories/adressrepositories");


const getAdress = async (userId) => {

  const result =
    await addressrepository.findAllByUserId(userId);

  return result;
};


const CreateNew = async ({
  userId,
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
}) => {

  if (isDefault) {

    await addressrepository.unsetDefaultForUser(userId);

  }


  const newAddress =
    await addressrepository.create({

      userId,
      FullName,
      MobileNumber,
      address,
      landmark,
      district,
      city,
      state,
      pincode,
      addressType,
      isDefault: isDefault || false,

    });


  return newAddress;
};


const updateAddress = async (
  addressId,
  userId,
  updates
) => {

  const existing =
    await addressrepository.findById(addressId);


  if (!existing) {

    const err =
      new Error("Address not found");

    err.statusCode = 404;

    throw err;

  }


  if (existing.userId.toString() !== userId) {

    const err =
      new Error("Not authorized to edit this address");

    err.statusCode = 403;

    throw err;

  }


  if (updates.isDefault) {

    await addressrepository.unsetDefaultForUser(userId);

  }


  const updatedAddress =
    await addressrepository.update(
      addressId,
      updates
    );


  return updatedAddress;
};


const deleteAddress = async (
  addressId,
  userId
) => {

  const existing =
    await addressrepository.findById(addressId);


  if (!existing) {

    const err =
      new Error("Address not found");

    err.statusCode = 404;

    throw err;

  }


  if (existing.userId.toString() !== userId) {

    const err =
      new Error("Not authorized to delete this address");

    err.statusCode = 403;

    throw err;

  }


  await addressrepository.deletebyId(addressId);


  return {
    message: "Address deleted successfully"
  };

};

const editAdress = async (addressId, updatedata) => {

  const user = await addressrepository.update(
    addressId,
    updatedata
  );

  if (!user) {
    throw new Error("Something wrong");
  }

  return user;
};
module.exports = {
  getAdress,
  CreateNew,
  updateAddress,
  deleteAddress,
  editAdress
};