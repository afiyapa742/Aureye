const mongoose = require("moongose");

const connectDB = async()=>{
try{
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");
}
catch(error){
 console.log("mongodb connection failed");
 console.log(error.message);
 process.exit(1);
}
}
module.export =  connectDB;

