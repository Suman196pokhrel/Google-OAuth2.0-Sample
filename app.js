//jshint esversion:6
require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session')
const passport = require('passport')
const passportLocal = require('passport-local');
const passportLocalMongoose = require('passport-local-mongoose')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');



const app = express();


// Middlewares 
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

//Setting up Session
app.use(session({
     secret: 'Thisisalingsentence.',
     resave: false,
     saveUninitialized: true,

}));

// Settingup Passport 
app.use(passport.initialize());
app.use(passport.session());  // yo site ko session Passport le handel garxa vanera vaneko

// Database Setup
mongoose.connect("mongodb://localhost:27017/usersDB", {
     useNewUrlParser: true,
     useUnifiedTopology: true
});
mongoose.set("useCreateIndex", true)

const userSchema = new mongoose.Schema({
     email: String,
     password: String,
     googleId : String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model('User', userSchema);
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
     done(null, user.id);
   });
   
passport.deserializeUser(function(id, done) {
     User.findById(id, function(err, user) {
       done(err, user);
     });
   });
passport.use(new GoogleStrategy({
     clientID: process.env.CLIENT_ID,
     clientSecret: process.env.CLIENT_SECRET,
     callbackURL: "http://localhost:3000/auth/google/secrets",
     userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
   },
   function(accessToken, refreshToken, profile, cb) {
        console.log(profile)
     User.findOrCreate({ googleId: profile.id }, function (err, user) {
       return cb(err, user);
     });
   }
 ));



app.get("/", (req, res) => {
     res.render('home')
});

app.get("/login", (req, res) => {
     res.render('login')
});

app.post("/login", (req, res) => {
     const newUser = new User({
          username: req.body.username,
          password: req.body.password
     })

     req.login(newUser,function(err){
          if(err){console.log(err)}
          else{
               res.redirect("/secrets");
          }
     })

});


app.get("/register", (req, res) => {
     res.render('register')
});

app.get("/secrets", function (req, res) {
     if (req.isAuthenticated()) {
          console.log("User is authenticated")
          res.render('secrets')
     } else {
          console.log("user not authenticated  ")
          res.redirect("/login")
     }
})


app.get("/auth/google/secrets", passport.authenticate('google', { failureRedirect: '/login' }),function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get('/auth/google',passport.authenticate("google", { scope: ["profile"] }));


app.post("/register", (req, res) => {
     User.register({ username: req.body.username }, req.body.password, function (err, user) {
          if (err) {
               console.log(err)
               res.redirect("/register");
          } else {
               passport.authenticate("local")(req, res, function () {
                    res.redirect("/secrets");
               })
          }
     })


});


app.get("/logout",(req,res)=>{
     req.logout()
     res.redirect("/")
})




app.listen(3000 || process.env.PORT, () => console.log("Node server running at port 3000"))