
const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const mongoose=require("mongoose");
const session=require("express-session");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
//const bcrypt=require("bcrypt");
//const md5=require("md5");
//const encrypt=require("mongoose-encryption");
//require("dotenv").config();

const app=express();
//const saltRounds=10;

app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(express.static("public"));

app.use(session({
  secret:"A little secret",
  resave:false,
  saveUninitialized:false

}));

app.use(passport.initialize());      
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/SecrectDB",{useNewUrlParser:true});

const userShema=new mongoose.Schema({
    email: String,
    password:String,
    secret:String
}); 
 
userShema.plugin(passportLocalMongoose);


//userShema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]});


const User=new mongoose.model("User",userShema)

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

  app.get("/",function (req,res) {
    res.render("home");
  });

  app.get("/login",function (req,res) {
    res.render("login");
  });
  app.post("/login",function (req,res) {
    const user = new User({
      username:req.body.username,
      password:req.body.password
    });
    req.login(user, function(err) {
      if (err) { 
        console.log(err); }
      else{
         passport.authenticate("local")(req,res,function(){
           res.redirect("/secrets");
         });}
    });
  });

  app.get("/register",function (req,res) {
    res.render("register");
  });
  app.post("/register",function (req,res) {
    User.register({username: req.body.username}, req.body.password, function (err,user) {
      if(err)
      {
        console.log(err);
        res.redirect("/register");
      }
      else
      {
        passport.authenticate("local")(req,res,function () {
          res.redirect("/secrets");
          })
      }
      })
  });

  app.get("/secrets",function (req,res) {
      User.find({"secret": {$ne: null}},function(err,foundUsers){
  if(err){
    console.log(err)
  }else{
    if(foundUsers){
      res.render("secrets",{listSecret:foundUsers});
    }
  }
      });
  });
    
  app.get("/logout",function (req,res) {
    req.logout();
    res.redirect('/');
  });
  app.get("/submit",function (req,res) {
    
    if(req.isAuthenticated())
    {
    res.render("submit");
    }
    else
    {
      res.redirect("/login")
    }
  });
  app.post("/submit",function (req,res) {
    const newSecret=req.body.secret
    console.log(req.user)
    User.findById(req.user.id,function (err,foundUser) {
      if(err){
        console.log(err);
      }else{
        if(foundUser){
          console.log(foundUser)
          foundUser.secret=newSecret;
          foundUser.save(function(){
            res.redirect("/secrets");
          })
        }
      }
      })
    
  });

app.listen(3000,function () {
    console.log("Start server on port 3000");
  })
