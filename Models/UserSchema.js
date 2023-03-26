const mongoose=require('mongoose');

var bcrypt = require('bcryptjs');
const jwt=require('jsonwebtoken');

const GeoSchema=new mongoose.Schema({
    type:{
        type:String,
        default:"Point"
    },
    coordinates:{
        type:[Number],
        index:"2dsphere"
    }
})

const userSchema=new mongoose.Schema({
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
     location:{
         type:String,
        
     },
     description:{
         type:String,
         
     },
     Picture:{
        type:String,
    },
     geometry:GeoSchema,

     Menus:[
         {
            
            ProductName:{
                type:String,
            },
            Price:{
                type:String,
            },
            Picture:{
                type:String,
            }
            

            
        

         }
     ],
     PostRequest:[
        {
            Description:{
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
    Comment:[
        {
            Username:{
                type:String
            },
           CateringComment:{
               type:String
           },
           Value:{
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



userSchema.pre('save',async function(next){
    if(this.isModified('password')){
        this.password=await bcrypt.hash(this.password,12);
        this.repassword=await bcrypt.hash(this.repassword,12);
    }
    next();

});

// we generating token
userSchema.methods.generateAuthToken= async function(){
    try{
          let token=jwt.sign({_id:this._id}, process.env.SECRET_KEY);
          this.tokens=this.tokens.concat({token:token});
          await this.save();
          return token;
    }catch(err){
     console.log(err);
    }
}

const User=mongoose.model('USER',userSchema);

module.exports=User;