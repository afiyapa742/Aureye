const Meterial = require("../models/meterial");

const getmeterial = async()=>{
    return await Meterial.find()
}

const addmeterial =  async(meterialdata)=>{
    return await Meterial.create(meterialdata)
}
const updatemeterial = async(id,data)=>{
    return await Meterial.findByIdAndUpdate(id,data,{returnDocument:"after"})
}
const deletemeterial = async(id)=>{
    return await Meterial.findByIdAndDelete(id) }

const updatestatus = async (id, status) => {
  return await Meterial.findByIdAndUpdate(
    id,
    { Status: status },
    { returnDocument: "after" }
  );
};
    module.exports = 
    {getmeterial,
    addmeterial,
    updatemeterial,
    deletemeterial,
    updatestatus
    }