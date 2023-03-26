

const mongoose=require("mongoose");
const DB="mongodb+srv://moosa:hastle1122@cluster0.txbvw.mongodb.net/Catering?retryWrites=true&w=majority"

mongoose.connect(DB,{
    useNewUrlParser:true,
    useCreateIndex:true,
    useUnifiedTopology:true,
    useFindAndModify:false

}).then(()=>{
    console.log("connection successfull")
}).catch((err)=>{
    console.log("no connections")
})