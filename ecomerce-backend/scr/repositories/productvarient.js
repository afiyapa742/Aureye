const Product = require("../models/productvarient");

const getvarient = async (data, skip, limit) => {
  return await Product.find(data)
    .skip(skip)
    .limit(limit);
};
const addvarient = async(data)=>{
    return await Product.create(data)
}
const edivarient = async(id,updata)=>{
    return await Product.findByIdAndUpdate(id,updata,{returnDocument:"after",   runValidators: true})
}
const deletevarient = async(id)=>{
    return await Product.findByIdAndDelete(id)
}

module.exports = {
  getvarient,
  addvarient,
  edivarient,
  deletevarient
};