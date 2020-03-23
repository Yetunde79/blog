const express = require("express");
const router = express.Router();
const passport = require("passport");
const Blog = require("../models/blog");
const User = require("../models/user");

// INDEX ROUTE
router.get("/", function(req, res) {
  Blog.find({}, function(err, blogs) {
    if (err) {
      console.log("ERROR!");
    } else {
      res.render("blogs/index", { blogs: blogs });
    }
  }).sort({ created: "descending" });
});

//NEW ROUTE
router.get("/new", isLoggedIn, function(req, res) {
  res.render("blogs/new");
});

//ABOUT ROUTE
router.get("/about", function(req, res) {
  res.render("blogs/about");
});

//CONTACT ROUTE
router.get("/contact", function(req, res) {
  res.render("blogs/contact");
});

//register
router.get("/register", function(req, res) {
  res.render("register");
});

router.post("/register", function(req, res) {
  req.body.username;
  req.body.password;
  User.register(
    new User({ username: req.body.username }),
    req.body.password,
    function(err, user) {
      if (err) {
        console.log(err);
        return res.render("register"); //if error go back to register
      }
      passport.authenticate("local")(req, res, function() {
        //local strategy, can be changed to another eg twitter
        res.redirect("/new"); //once registered you go to secret page
      });
    }
  );
});

//Login Route
router.get("/login", function(req, res) {
  res.render("login");
});

//login logic
//middleware
router.post(
  "/login",
  passport.authenticate("local", {
    //passp.auth goes btwn route & function(req, res). Its a middleware. Runs immediately after getting request
    successRedirect: "/", //if succesfull
    failureRedirect: "/login" //if failed
  }),
  function(req, res) {}
);

//Logout Route
router.get("/logout", function(req, res) {
  req.logout(); //logout is a fun from passport
  res.redirect("/"); //redirects to homepage
});

function isLoggedIn(req, res, next) {
  //to check if user is logged in. its a middleware, next refers to object called next
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

module.exports = router;
