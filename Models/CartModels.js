const mongoose=require('mongoose');

var bcrypt = require('bcryptjs');
const jwt=require('jsonwebtoken');
const CartModels=new mongoose.Schema({
    Customeremail:{
        type:String,
        required:true
    },
    Catid:{
        type:String,
        required:true
    },
    CateringNames:{
       type:String,
    },
    CustomerName:{
        type:String,
    },
    payment:{
       type:Number,
    },
    id:{
       type:String
    },
    Status:{
      type:String
    },
    dates:{
        type:String
    },
    address:{
        type:String
    },
    contact:{
        type:String
    },
    Comment:{
        type:String
    },
    Value:{
        type:Number
    },
    Items:[
        {
            ProductName:{
                type:String,
                
            },
            Price:{
               type:Number,
               
           },
            qty:{
               type:String,
               
           },
           

        }
    ],
    

})

const Carts=mongoose.model('Carts', CartModels);

module.exports= Carts;
