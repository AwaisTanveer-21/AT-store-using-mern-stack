const mongoose = require('mongoose')

const connectDB = async () {
    try {
        await mongoose.connect(process.env.MONGO_URI,{
            useNewURlParser : true,
            UseUnified :true,)}
            console.log("mongodb successfully connected")
        }
    }
    catch(error){
        console.log("mongodb connection failed: ,", error.message)
        process.exit(1)
}