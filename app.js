//jshint esversion:6
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session')
const passport = require('passport')
const passportLocal = require('passport-local');
const passportLocalMongoose = require('passport-local-mongoose')



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
app.use(passport.session());

// Database Setup
mongoose.connect("mongodb://localhost:27017/usersDB", {
     useNewUrlParser: true,
     useUnifiedTopology: true
});
mongoose.set("useCreateIndex", true)

const userSchema = new mongoose.Schema({
     email: String,
     password: String
});

userSchema.plugin(passportLocalMongoose)

const User = mongoose.model('User', userSchema);
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());




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




app.listen(3000, () => console.log("Node server running at port 3000"))