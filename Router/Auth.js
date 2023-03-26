const express = require('express');
const user = require("../Models/UserSchema");
const Cater=require("../Models/CustomerSchema");
const Carts=require("../Models/CartModels")
const router = express.Router();
var nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
const cookieParser = require("cookie-parser");
router.use(cookieParser());
const Authenticate=require("../Middleware/Authenticate.js")
const bodyParser = require('body-parser')
const multer=require("multer")
const CustomerAuthenticate=require("../Middleware/CustomerAuthenticate.js")
const stripe = require("stripe")(process.env.STRIPE_SECRET_TEST)
const urlencodedParser = bodyParser.urlencoded({ extended: false })
require("../DB/Conn")

const storage =multer.diskStorage({
    destination:(req,file,callback)=>{
        callback(null,"../cateringapp/public/Upload/");
    },
    filename:(req,file,callback)=>{
        callback(null,file.originalname);
    }
})
const storage1 =multer.diskStorage({
    destination:(req,file,callback)=>{
        callback(null,"../cateringapp/public/CateringImages/");
    },
    filename:(req,file,callback)=>{
        callback(null,file.originalname);
    }
})
var val = Math.floor(1000 + Math.random() * 9000);
const upload=multer({storage:storage})
const uploa1=multer({storage:storage1})

router.get("/CateringViewOrderRequest",Authenticate,async(req,res)=>{

    res.send(req.rootUser);
    console.log(req.rootUser)
    
    
})
router.get('/', (req, res) => {
    res.cookie("thapa",'test');
    console.log("mosoa")
})


router.post("/CateringProfile",uploa1.single('Picture'),Authenticate,async(req,res)=>{
    const{name,email,password,contact,description,location,longitude,latitude}=req.body;
  
    const Picture=req.file.originalname;
    console.log(req.body)
  
    if (!name || !email || !password || !contact ||!description ||!location) {
        console.log("moosaraza")
        return res.status(400).json({ error: "Filled everything" })
        
    }else{
        try {
            const UserExist = await user.findOne({ email: email });
            
            if (UserExist) {
               UserExist.name=name;
               UserExist.email=email;
               UserExist.password=password;
               UserExist.contact=contact;
              
               UserExist.description=description;
               UserExist.location=location;
               UserExist.geometry={"type":"point","coordinates":[longitude,latitude]};
               UserExist.Picture=Picture;
               await UserExist.save();
               res.json({ message: "ProfileUpdated" });
    
            }else{
                res.status(400).json("user not exist");
            }
    
           
    
        } catch (err) {
            console.log(err);
        }

    }
  

})
router.post('/Register', async (req, res) => {

    const { name, email, password, repassword, choice } = req.body;
    console.log(name);
    console.log(email);
    console.log(password);
    console.log(repassword);
    console.log(choice);

    if (!name || !email || !password || !repassword || !choice) {
        return res.status(422).json({ error: "Filled everything" })
    }

    try {
        if(choice==="Seller"){

        const UserExist = await user.findOne({ email: email });
        if (UserExist) {
            return res.status(422).json({ error: "email already Exist" });
        }else{
            const User = new user({ name, email, password, repassword, choice });
            await User.save();
            res.status(201).json({ message: "user registred successfully" });

        }

      
    }else if(choice==="Customer"){
        const UserExist = await Cater.findOne({ email: email });
        if (UserExist) {
            return res.status(422).json({ error: "email already Exist" });
        }else{
            const CaterExist = new Cater({ name, email, password, repassword, choice });
            await CaterExist.save();
            res.status(201).json({ message: "user registred successfully" });

        }

      

    }

    } catch (err) {
        console.log(err);
    }

});

router.post("/login",  async (req, res) => {


    try {
        let token;
        const { email, password, choice } = req.body;
        if (!email || !password || !choice) {
            return res.status(400).json({ error: "Please filled data" })
        }
       if(choice==="Seller"){
        const userLogin = await user.findOne({ email: email });

        if(!userLogin){

        }else
        
        if (userLogin) {
            const ismatch = await bcrypt.compare(password, userLogin.password);
            
           

            token = await userLogin.generateAuthToken();
              console.log(token);
            //  console.log(password);
            //  console.log(userLogin.password);
            //  console.log("status",ismatch);
            res.cookie("jwtoken", token, {
                expires: new Date(Date.now() + 2589200000),
                httpOnly: true
            });

            if (!ismatch) {
                res.status(400).json({ error: "invalid Credentials" });
            } else {
                   res.json({ message: "user login successfully" });
            }
        } else {
            res.status(400).json({ message: "Invalid Credential" })
        }
    }else if(choice==="Customer"){
        const userLogin = await Cater.findOne({ email: email });

        //console.log(userLogin);
        
        if (userLogin) {
            const ismatch = await bcrypt.compare(password, userLogin.password);
            
           

            token = await userLogin.generateAuthToken();
              console.log(token);
          
            res.cookie("jwtoken", token, {
                expires: new Date(Date.now() + 2589200000),
                httpOnly: true
            });

            if (!ismatch) {
                res.status(400).json({ error: "invalid Credentials" });
            } else {
                   res.json({ message: "user login successfully" });
            }
        } else {
            res.status(400).json({ message: "Invalid Credential" })
        }

    }

    } catch (err) {
        console.log(err);

    }

});

router.get("/CateringHome",Authenticate,(req,res)=>{
    
      res.send(req.rootUser);
     
     
})
router.get("/logout",(req,res)=>{
    res.clearCookie('jwtoken');
    res.status(200).send('userlogout')
})


router.get("/CateringProfile", Authenticate,async(req,res)=>{
    
    
    res.send(req.rootUser);


});
router.post("/CreateMenus",upload.single('Picture'),Authenticate,async(req,res)=>{

   const{Description,Price}=req.body;
    const Picture=req.file.originalname;
   
   const array=[{"ProductName":Description,"Price":Price,"Picture":Picture}]
  
  try{
       const userLogin = await user.findOneAndUpdate({
            email:req.rootUser.email
       },{
           $push:{
               Menus:array

               
            
           }
         
       })

        res.status(200).json({ Message: "Saved Successfully" });
    }catch(err){
        console.log(err);
        res.json({error:"unable to save"})
    }
   

})
router.get("/CreateMenus",Authenticate,async(req,res)=>{
    res.send(req.rootUser);
})
router.get("/ViewMenus",Authenticate,async(req,res)=>{
    res.send(req.rootUser)
})
router.get("/ViewMenus/Edit/:id",Authenticate,async(req,res)=>{
 
    
    let id=req.params.id;
   
   res.send(req.rootUser)

    
})
router.post("/ViewMenus/Edit/:id",upload.single('Picture'),async(req,res)=>{
    console.log(req.params.id);
    
    const{ProductName,Price}=req.body;
    const Picture=req.file.originalname;
    
    console.log(ProductName)
    console.log(Price)
    console.log(Picture)
try{
    const userLogin = await user.findOneAndUpdate({
         "Menus._id":req.params.id
    },
    {
        "$set":{

        
        "Menus.$.ProductName":ProductName,
        "Menus.$.Price":Price,
        "Menus.$.Picture":Picture


        }

    })
    res.status(200).json({ Message: "Updated Successfully" });
}catch(err){
    console.log(err);
    res.json({error:"unable to save"})
}
   
    
  
})

router.get("/ViewMenus/Delete/:id",async(req,res)=>{
    console.log(req.params.id)
    console.log("moosa")
    
    try{
        const userLogin = await user.findOneAndUpdate({
             "Menus._id":req.params.id
        },
        {
            "$pull":{
    
                Menus:{
                    _id:req.params.id
                }
    
    
            }
        }
        )
        res.status(200).json({ Message: "Deleted Successfully Successfully" });
    }catch(err){
            console.log(err);
        }

})
router.get("/",CustomerAuthenticate,async(req,res)=>{
    res.send(req.rootUser);
   

})
router.get("/getCateringOrder",Authenticate,async(req,res)=>{
   

    try{
        const order=await Carts.find({ Catid:req.rootUser._id});
        console.log(order);
     
        if(order.length==0){

           
            res.send({  User: req.rootUser });

        }else{
            const[{Items}]=order;
            console.log(Items);
            console.log("k")
            res.send({ result: order, User: req.rootUser,OrderMenu:Items });
        }
       

    }catch(err){

        console.log(err);

    }


})
router.get("/CateringOrderDetails/:id",Authenticate,async(req,res)=>{
    console.log(req.params.id);

    const orderexist=await Carts.findOne({_id:req.params.id});
    const{Items}=orderexist;
    console.log(Items);
    res.send({order:orderexist,user:req.rootUser,Ordermenu:Items})
})

router.post("/AcceptOrder",async(req,res)=>{
    const{_id}=req.body.orderDetails;
    console.log(_id)
    const order = await Carts.findOneAndUpdate({
        "_id":_id
   },
   {
       "$set":{

           "Status":"Delivered!"
    }

   })

})

router.post("/PostRequestpayment",Authenticate,async(req,res)=>{
    console.log(req.body);
    const{id,Descrip,CustomerEmail}=req.body;
    const ActualAmount=1500;
   const amount=ActualAmount*100;
   console.log(Descrip)

    try {
		const payment = await stripe.paymentIntents.create({
			amount,
			currency: "pkr",
			description: req.rootUser.email,
			payment_method: id,
			confirm: true
		})
	console.log("Payment", payment.amount)
		res.json({
			message: "Payment successful",
			success: true
		})
	} catch (error) {
		console.log("Error", error)
		res.json({
			message: "Payment failed",
			success: false
		})
	}

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'rmoosa276@gmail.com',
          pass: 'vbvvkldizyfxljgr'
        }
      });
      var mailOptions = {
        from: 'rmoosa276@gmail.com',
        to: `${CustomerEmail}`,
        subject: 'OTP',
        text: `${Descrip}`
      };
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
          res.send({value:val})
        }
      });

   

})

router.post("/forgot",async(req,res)=>{
    console.log(req.body)
    const{email,choice}=req.body;
    if(choice==="Seller"){
         
        const users=await user.findOne({email:email});
        console.log(users);
        if(users===null){
          res.status(400).send({message:"Error not Send"})
        }else{
             res.status(200).send({mesaage:"user Found"})
             var val = Math.floor(1000 + Math.random() * 9000);
               
             var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                  user: 'rmoosa276@gmail.com',
                  pass: 'vbvvkldizyfxljgr'
                }
              });
              var mailOptions = {
                from: 'rmoosa276@gmail.com',
                to: `${email}`,
                subject: 'OTP',
                text: `${val}`
              };
              transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                  console.log(error);
                } else {
                  console.log('Email sent: ' + info.response);
                  res.send({value:val})
                }
              });

        } 
    }else if(choice==="Customer"){
        const users=await Cater.findOne({email:email});
        console.log(users);
        if(users===null){
          res.status(400).send({message:"Error not Send"})
        }else{
            
             var val = Math.floor(1000 + Math.random() * 9000);
             var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                  user: 'rmoosa276@gmail.com',
                  pass: 'vbvvkldizyfxljgr'
                }
              });
              var mailOptions = {
                from: 'rmoosa276@gmail.com',
                to: `${email}`,
                subject: 'OTP',
                text: `${val}`
              };
              transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                  console.log(error);
                } else {
                  console.log('Email sent: ' + info.response);
                  res.send({value:val})
                }
              });
              res.status(200).send({mesaage:"user Found",value:val})
        } 

    }
})

router.post("/changepassword",async(req,res)=>{


    console.log(req.body)
    const{password,email,choice}=req.body;
    const pass=await bcrypt.hash(password,12);
    if(choice==="Customer"){
        const order = await Cater.findOneAndUpdate({
            "email":email
       },
       {
           "$set":{
    
               "password":pass,
               "repassword":pass
    
    
           }
    
       })
       res.status(400).send({message:"password Changed"})

    }else if(choice==="Seller"){
        const order = await user.findOneAndUpdate({
            "email":email
       },
       {
           "$set":{
    
               "password":pass,
               "repassword":pass
    
    
           }
    
       })
       res.status(400).send({message:"password Changed"})

    }

    

})

router.get("/OrderConfirmation",Authenticate,async(req,res)=>{
 res.send(req.rootUser);
})

module.exports = router;