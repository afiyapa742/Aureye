
const  {getmeterial,
    addmeterial,
    updatemeterial,
    deletemeterial,
    updatestatus
    } = require("../repositories/meterial");

    const getMeterial = async () => {
  const meterial = await getmeterial();
  if (!meterial) {
    throw new Error("something went wrong");
  }
  return meterial;
};

const addMeterial = async(meterialdata)=>{

    const meterial = await addmeterial(meterialdata)
    if(!meterial){
        throw new Error("meterial not added")
    }
    return meterial
}
const updateMeterial = async(id,updata)=>{
    const meterial = await updatemeterial(id,updata)
    if(!meterial){
        throw new Error("something wrong")
    }
    return meterial
}
const deleteMeterial = async (id) => {
  const meterial = await deletemeterial(id);

  if (!meterial) {
    throw new Error("something wrong");
  }

  return meterial;
};
const updateStatus = async (id, status) => {
  const meterial = await updatestatus(id, status);

  if (!meterial) {
    throw new Error("something wrong");
  }

  return meterial;
};

module.exports = {
    getMeterial,
    addMeterial,
    updateMeterial,
    deleteMeterial,
    updateStatus
}