const express = require('express');
const mongoose = require('mongoose');
const user = require("../Models/UserSchema");
const Cater = require("../Models/CustomerSchema");
const Carts = require("../Models/CartModels");
const ManagementUsers = require("../Models/ManagmentUser")
const Fav = require("../Models/Favourite")
const router = express.Router();
const jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
const cookieParser = require("cookie-parser");
router.use(cookieParser());
const CustomerAuthenticate = require("../Middleware/CustomerAuthenticate.js")
const ManagmentAuthenticate=require("../Middleware/ManagmentAuthenticate.js")
const bodyParser = require('body-parser')
const multer = require("multer")
const urlencodedParser = bodyParser.urlencoded({ extended: false })
const stripe = require("stripe")(process.env.STRIPE_SECRET_TEST)
require("../DB/Conn")


const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, "../cateringapp/public/CateringImages/");
    },
    filename: (req, file, callback) => {
        callback(null, file.originalname);
    }
})

const upload = multer({ storage: storage })


router.get("/CustomerHome", CustomerAuthenticate, async (req, res) => {

    res.send(req.rootUser);


})
router.get("/carteringmainpages", CustomerAuthenticate, async (req, res) => {
    const longitude = req.rootUser.longitude;
    const latitude = req.rootUser.latitude;
    user.aggregate([{
        $geoNear: {
            near: {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            distanceField: 'distance',
            maxDistance: 10000,
            spherical: true
        }
    }])
        .then(results => {
            res.send({ result: results, User: req.rootUser });

        })


})
router.get("/Profile", CustomerAuthenticate, async (req, res) => {
    res.send(req.rootUser);
})
router.post("/Profile", async (req, res) => {
    const { name, email, password, contact, location } = req.body;

    try {
        const UserExist = await Cater.findOne({ email: email });

        if (UserExist) {
            UserExist.name = name;
            UserExist.email = email;
            UserExist.password = password;
            UserExist.contact = contact;


            UserExist.address = location;
            await UserExist.save();
            res.json({ message: "ProfileUpdated" });

        } else {
            res.status(400).json("user not exist");
        }



    } catch (err) {
        console.log(err);
    }
})
router.get("/post", CustomerAuthenticate, async (req, res) => {
    res.send(req.rootUser);
})
router.post("/post", CustomerAuthenticate, async (req, res) => {

    const { Description, Time} = req.body;
    const name=req.rootUser.name;
    const PostID=Math.floor(Math.random()*90000) + 10000;
    console.log(name);
    const array = [{ "Description": Description, "Times": Time, "CustomerEmail": req.rootUser.email, "CustomerID": req.rootUser._id,"CustomerName":req.rootUser.name,"PostID":PostID }]
      console.log(array);
    try {
        const userLogin = await Cater.findOneAndUpdate({
            email: req.rootUser.email
        }, {
            $push: {
                PostRequest: array
            }

        })
        const userLogin1 = await user.updateMany({}, { $push: { "PostRequest": array } });

        res.json({ message: "Updated" })



    } catch (err) {
        console.log(err);

    }




})
router.post("/CustomerHome", CustomerAuthenticate, async (req, res) => {


    const { longitude, latitude, address } = req.body;

    try {
        const UserExist = await Cater.findOne({ email: req.rootUser.email });

        if (UserExist) {
            UserExist.longitude = longitude;
            UserExist.latitude = latitude;
            UserExist.address = address;
            await UserExist.save();
            res.json({ message: "ProfileUpdated" });

        }
    } catch (err) {
        console.log(err);
        res.status(400).json("user not exist");
    }
})

router.get("/Cater/:id", CustomerAuthenticate, async (req, res) => {

    const id = req.params.id;
    console.log(id);
    const USerExist = await user.findById({ _id: req.params.id });
      console.log(USerExist)
    res.send({ result: USerExist, User: req.rootUser });

})


router.get("/hello", async (req, res) => {
    var decoded = jwt.verify(req.cookies.jwt);
    const arr = JSON.parse(decoded);
    console.log(arr)
})
router.post("/payment", CustomerAuthenticate, async (req, res) => {
    const Customeremail = req.rootUser.email;
    const CustomerName = req.rootUser.name;
    let { id, Catid, Items, payment, CateringNames, address, contact } = req.body
    const Status = "In Progress";
    const datetime = new Date();
    const dates = datetime.toISOString().slice(0, 10);
    // console.log(address);

    try {
        const cart = await new Carts({ Customeremail, Catid, CateringNames, CustomerName, payment, id, Status, dates, address, contact, Items });
        await cart.save();


    } catch (err) {
        console.log(err);
    }

    const amount = req.body.payment * 100;
    // console.log(amount);
    try {
        const payment = await stripe.paymentIntents.create({
            amount,
            currency: "pkr",
            description: Customeremail,
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
})

router.get("/getorder", CustomerAuthenticate, async (req, res) => {

    const email = req.rootUser.email;
    console.log(email);

    try {
        const orderExist = await Carts.find({ Customeremail: email })
        //console.log(orderExist);
        if(orderExist.length==0){

            res.send({User: req.rootUser });

        }else{
            const [{ _id, Customeremail, Items, CateringNames }] = orderExist;
            console.log(Items);
            res.send({ result: orderExist, User: req.rootUser, Cname: CateringNames });

        }
       

    } catch (err) {
        console.log(err);
    }

})
router.get("/orderdetails/:id", CustomerAuthenticate, async (req, res) => {

    console.log(req.params.id);

    try {
        const orderexist = await Carts.findOne({ _id: req.params.id });
        //console.log(orderexist);
        const { Items } = orderexist;
        console.log(Items);
        res.send({ order: orderexist, user: req.rootUser, Ordermenu: Items })
    } catch (err) {
        console.log(err);
    }

})

router.post("/AddToFav",upload.single('Picture'), async (req, res) => {
     console.log(req.body);
     const { name, Description, location,id,picture } = req.body;
     const CateringID=id;
   
     try {

         const fac=await Fav.find({CateringID:id});
         console.log(fac.length);
         if(fac.length!=0){
             res.status(500).json({message:"My name is moosa"})

        }else{
             const favourite = await new Fav({ name, Description, location,CateringID,picture });
             await favourite.save();
             res.json({message:"Added"})

         }

       



     } catch (err) {
         console.log(err)
     }
})
router.get("/GetFav", CustomerAuthenticate, async (req, res) => {

    try {

        const favour = await Fav.find({});
        // console.log(favour);
        res.send({ cater: favour, user: req.rootUser })

    } catch (err) {
        console.log(err);
    }

})

router.get("/RemoveToFav/:id", async (req, res) => {
    console.log(req.params.id)
    try {

        const DeleteFav = await Fav.deleteOne({ CateringID: req.params.id })


    } catch (err) {

    }

})

router.get("/AdminDetails", async (req, res) => {
    try {
        const dataCart = await Carts.find({});
        console.log(dataCart)
        //  const[{Items}]=data;
        res.send({ result: dataCart });


    } catch (err) {
        console.log(err);
    }
})

router.post("/SendComment", async (req, res) => {
    console.log(req.body)
  const{CateringID,CustomerName,Comment,value}=req.body
     const orderexist = await Carts.findOne({ _id: req.body.orderid });

     if (orderexist) {
         orderexist.Comment = req.body.Comment;
         orderexist.Value=value;

         await orderexist.save();
         res.json({ message: "ProfileUpdated" });

    }
     const array=[{"Username":CustomerName,"CateringComment":Comment,"Value":value}]
     const userLogin = await user.findOneAndUpdate({
         _id:CateringID
    },{
        $push:{
            Comment:array

           
        
        }
     
    })
    
    //console.log(users)
})

// Admin Routes

router.post("/ManagementRequestpayment", async (req, res) => {
    console.log(req.body)
    const { id, email, password, repassword, username } = req.body;
    const ActualAmount = 2000;
    const amount = ActualAmount * 100;




    try {
        const payment = await stripe.paymentIntents.create({
            amount,
            currency: "pkr",
            description: req.body.Email,
            payment_method: id,
            confirm: true
        })
        console.log("Payment", payment.amount)

    } catch (error) {
        console.log("Error", error)

    }

    const UserExist = await ManagementUsers.findOne({ email: email });
    if (!UserExist) {
        const User = new ManagementUsers({ username, email, password, repassword });
        await User.save();
        res.json({ message: "ProfileUpdated" });
    } else {
        res.status(400).json({ error: "Email Already Registered" })
    }






})

router.post("/logins", async (req, res) => {
    console.log(req.body)

    try {
        let token;
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Please filled data" })
        }

        const userLogin = await ManagementUsers.findOne({ email: email });

        if (!userLogin) {

        } else

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




    } catch (err) {
        console.log(err);

    }
})

router.post("/OrderAdd",ManagmentAuthenticate, async (req, res) => {
    

    const { Description, Address, CustomerName, CustomerMobile, time, TimeActual } = req.body;
   
   
   const array=[{"Description":Description,"Address":Address,"CustomerName":CustomerName,"CustomerMobile":CustomerMobile,"time":time,"TimeActual":TimeActual}]
  
  try{
       const userLogin = await ManagementUsers.findOneAndUpdate({
            email:req.rootUser.email
       },{
           $push:{
               Orders:array

               
            
           }
         
       })

        res.status(200).json({ Message: "Saved Successfully" });
    }catch(err){
        console.log(err);
        res.json({error:"unable to save"})
    }
})
router.get("/GetUserData",ManagmentAuthenticate,async(req,res)=>{
   
    res.send(req.rootUser)

})

router.get("/getorders",ManagmentAuthenticate, async (req, res) => {
         console.log("hello")

  try{
         const orde=await ManagementUsers.findOne({email:req.rootUser.email});
       //  const[{Orders}]=orde;
        
         const a=orde.Orders;
         console.log(a);
         if(a.length===0){
              console.log("h1")
          return  res.status(400).json({ Message: "User Have no Order Add some" });
         }else{
            const arrays= a.reduce(function(prev, curr) {
                return prev.time < curr.time ? prev : curr;
            });
            console.log(arrays);
            remainingArr = a.filter(data => data._id != arrays._id);
            console.log(remainingArr)
            res.send({ result: arrays, AllOrders: remainingArr,UserResult:req.rootUser });


         }

       
    }catch(err){
        console.log(err);
    }


})

router.get("/DeleteOrder/:id",async(req,res)=>{
    console.log(req.params.id);
    if(!req.params.id){
          
       return res.status(500).json({message:"Add New Order"})
    }else{
        
    
    try{
        const userLogin = await ManagementUsers.findOneAndUpdate({
             "Orders._id":req.params.id
        },
        {
            "$pull":{
    
                Orders:{
                    _id:req.params.id
                }
    
    
            }
        }
        )
        res.status(200).json({ Message: "Deleted Successfully Successfully" });
    
    }catch(err){
            console.log(err);
        }
    }

})

router.post("/SaveEmployees",ManagmentAuthenticate,async(req,res)=>{
     console.log(req.body);

     const{Name,Address,Mobile,Salary}=req.body;
     const array=[{"Name":Name,"Address":Address,"Mobile":Mobile,"Salary":Salary}]
  
     try{
          const userLogin = await ManagementUsers.findOneAndUpdate({
               email:req.rootUser.email
          },{
              $push:{
                Employee:array
   
                  
               
              }
            
          })
   
           res.status(200).json({ Message: "Saved Successfully" });
       }catch(err){
           console.log(err);
           res.json({error:"unable to save"})
       }
    // res.json({message:"saved Successfully"})
})
router.get("/ViewEmployees",ManagmentAuthenticate,async(req,res)=>{
    const emp=await ManagementUsers.findOne({email:req.rootUser.email});
   
     
      const a=emp.Employee;
      console.log(a)

     res.send({user:req.rootUser,EmployeeData:a});

})

router.get("/ViewEmployees/Delete/:id",async(req,res)=>{
     console.log(req.params.id);
     try{
        const userLogin = await ManagementUsers.findOneAndUpdate({
             "Employee._id":req.params.id
        },
        {
            "$pull":{
    
                Employee:{
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
router.get("/ViewEmployees/Edit/:id",ManagmentAuthenticate,async(req,res)=>{

    console.log(req.params.id);
     try{

         const emp=await ManagementUsers.findOne({email:req.rootUser.email});
   
     
      const a=emp.Employee;
      //console.log(a);
    
     const remainingArr = a.filter(data => data._id == req.params.id);
    console.log(remainingArr);
       const[{_id,Name,Address,Mobile,Salary}]=remainingArr;
      // console.log(Name)

    
       res.send({user:req.rootUser,UserName:Name,UserAddress:Address,UserMobile:Mobile,UserSalary:Salary} )
      
     }catch(err){
         console.log(err)
     }

})
router.post("/ViewEmployees/Edit/:id",async(req,res)=>{
   console.log(req.body);

    const{Name,Address,Mobile,Salary}=req.body;
    try{
        const userLogin = await ManagementUsers.findOneAndUpdate({
             "Employee._id":req.params.id
        },
        {
            "$set":{
    
            "Employee.$.Name":Name,
            "Employee.$.Address":Address,
            "Employee.$.Mobile":Mobile,
            "Employee.$.Salary":Salary
    
    
            }
    
        })
        res.status(200).json({ Message: "Updated Successfully" });
    }catch(err){
        console.log(err);
        res.json({error:"unable to save"})
    }
})
router.get("/viewReques",CustomerAuthenticate,async(req,res)=>{

    res.send(req.rootUser)

})
router.get("/DeleteCatering/:id",async(req,res)=>{
    console.log(req.params.id)
      
    try{
        const userLogin = await Cater.findOneAndUpdate({
             "PostRequest.PostID":req.params.id
        },
        {
            "$pull":{
    
                PostRequest:{
                    PostID:req.params.id
                }
    
    
            }
        }
        )
        const userLogin1 = await user.updateMany({
            "PostRequest.PostID":req.params.id
        }, {
             "$pull": 
             { 
                PostRequest:{
                PostID:req.params.id
        }
     }
     }
     );
        res.status(200).json({ Message: "Deleted Successfully Successfully" });
    
    }catch(err){
            console.log(err);
        }
    

})
module.exports = router;