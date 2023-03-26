const mongoose=require('mongoose');

var bcrypt = require('bcryptjs');
const jwt=require('jsonwebtoken');

const CustomerSchema=new mongoose.Schema({
    name:{
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
    choice:{
        type:String,
        required:true
    },
    contact:{
       type:String,
       
    },
    address:{
        type:String
    },
    longitude:{
        type:String
    },
    latitude:{
        type:String
    },
    PostRequest:[
        {
            Description:{
                type:String,
                
            },
             Dates:{
               type:String,
               
           },
            Times:{
               type:String,
               
           },
           CustomerEmail:{
               type:String,
           },
           CustomerID:{
               type:String,
           },
           CustomerName:{
            type:String
           },
           PostID:{
            type:String
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



CustomerSchema.pre('save',async function(next){
    if(this.isModified('password')){
        this.password=await bcrypt.hash(this.password,12);
        this.repassword=await bcrypt.hash(this.repassword,12);
       
    }
    next();

});
CustomerSchema.methods.generateAuthToken = async function(){
    try{
          let token=jwt.sign({_id:this._id}, process.env.SECRET_KEY);
          this.tokens=this.tokens.concat({token:token});
          await this.save();
          return token;
    }catch(err){
     console.log(err);
    }
}



const Cater=mongoose.model('Cater', CustomerSchema);

module.exports=Cater;