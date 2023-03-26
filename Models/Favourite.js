const mongoose=require('mongoose');

var bcrypt = require('bcryptjs');
const jwt=require('jsonwebtoken');
const Favourite=new mongoose.Schema({

    name:{
        type:String
    },
    Description:{
        type:String
    },
    location:{
        type:String
    },
    CateringID:{
        type:String
    },
    picture:{
        type:String
    }
   

})

const Fav=mongoose.model('Favourite', Favourite);

module.exports= Fav;
