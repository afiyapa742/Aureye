const {
  getvarient,
  addvarient,
  edivarient,
  deletevarient
} = require("../repositories/productvarient");

const Getvarient = async (data, skip, limit) => {
  const product = await getvarient(data, skip, limit);

  if (!product) {
    throw new Error("Something went wrong");
  }

  return product;
};

const Addvarient = async(data)=>{
    const product = await addvarient(data);
if(!product){
    throw new Error("something wentwrong")
}
return product
}

const Editvarient = async(id,updata)=>{
    const product = await  edivarient(id,updata)
    if(!product){
        throw new Error("something wentwrong")
    }
    return product
}
const Deletevarient = async (id) => {
  const product = await deletevarient(id);

  if (!product) {
    throw new Error("Something went wrong!!!");
  }

  return product;
};

module.exports = {
  Getvarient,
  Addvarient,
  Editvarient,
  Deletevarient
}