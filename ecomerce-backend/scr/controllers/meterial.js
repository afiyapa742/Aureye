const {
    getMeterial,
    addMeterial,
    updateMeterial,
    deleteMeterial,
    updateStatus
} = require("../services/meterial")


// ADD MATERIAL
const AddMeterial = async (req, res) => {
  try {
    const meterialdata = req.body;

    const meterial = await addMeterial(meterialdata);

    return res.status(201).json({
      message: "Material added successfully",
      data: meterial
    });

  } catch (error) {
    console.error("ADD MATERIAL ERROR:", error);

    return res.status(400).json({
      message: error.message
    });
  }
};


// GET ALL MATERIALS
const GetMeterial = async (req, res) => {
  try {
    const meterial = await getMeterial();

    return res.status(200).json({
      message: "Materials fetched successfully",
      data: meterial
    });

  } catch (error) {
    console.error("GET MATERIAL ERROR:", error);

    return res.status(400).json({
      message: error.message
    });
  }
};


// EDIT MATERIAL
const UpdateMeterial = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    const meterial = await updateMeterial(
      id,
      updatedData
    );

    return res.status(200).json({
      message: "Material updated successfully",
      data: meterial
    });

  } catch (error) {
    console.error("UPDATE MATERIAL ERROR:", error);

    return res.status(400).json({
      message: error.message
    });
  }
};


// UPDATE MATERIAL STATUS
const UpdateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const meterial = await updateStatus(
      id,
      status
    );

    return res.status(200).json({
      message: "Material status updated successfully",
      data: meterial
    });

  } catch (error) {
    console.error("UPDATE STATUS ERROR:", error);

    return res.status(400).json({
      message: error.message
    });
  }
};


// DELETE MATERIAL
const DeleteMeterial = async (req, res) => {
  try {
    const { id } = req.params;

    const meterial = await deleteMeterial(id);

    return res.status(200).json({
      message: "Material deleted successfully",
      data: meterial
    });

  } catch (error) {
    console.error("DELETE MATERIAL ERROR:", error);

    return res.status(400).json({
      message: error.message
    });
  }
};


module.exports = {
  AddMeterial,
  GetMeterial,
  UpdateMeterial,
  UpdateStatus,
  DeleteMeterial
};