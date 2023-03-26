const mongoose=require('mongoose');

var bcrypt = require('bcryptjs');
const jwt=require('jsonwebtoken');
const ManagmentUser=new mongoose.Schema({

    username:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    repassword:{
        type:String,
        required:true
    },
    Orders:[
        {
            Description:{
                type:String
            },
            Address:{
                type:String
            },
            CustomerName:{
                type:String
            },
            CustomerMobile:{
                type:String
            },
            time:{
                type:Number
            },
            TimeActual:{
                type:String
            }
        }
    ],
    Employee:[
        {
            Name:{
                type:String
            },
            Address:{
                type:String
            },
            Mobile:{
                type:String
            },
            Salary:{
                type:Number
            }
           

        }

    ],
    tokens:[
        {
            token:{
                type:String,
                required:true
            }
        }
    ]
    
    

})

ManagmentUser.pre('save',async function(next){
    if(this.isModified('password')){
        this.password=await bcrypt.hash(this.password,12);
        this.repassword=await bcrypt.hash(this.repassword,12);
    }
    next();

});
ManagmentUser.methods.generateAuthToken= async function(){
    try{
          let token=jwt.sign({_id:this._id}, process.env.SECRET_KEY);
          this.tokens=this.tokens.concat({token:token});
          await this.save();
          return token;
    }catch(err){
     console.log(err);
    }
}

const ManagmentUsers=mongoose.model('ManagmentUsers',ManagmentUser);

module.exports= ManagmentUsers;
