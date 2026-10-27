const mongoose =  require ('mongoose');

const Adminschema = new mongoose.Schema({

id:{
    type:String,
    required:true,
    unique:true
},
email :{
    type:String,
    required:true,
    unique:true,
    lowercase:true,
    trim:true
},
password:{
    type:String,
    required:true
},
profileImage: {
  type: String,
  default: ""
}
},
{
timestamps:true
}

)

const Admin = mongoose.model("Admin",Adminschema);
module.exports = Admin;