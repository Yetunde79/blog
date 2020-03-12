const express = require("express");
const app = express();
const expressSanitizer = require("express-sanitizer"); //remove js script from code
const methodeOverride = require("method-override");
const bodyParser = require("body-parser");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const mongoose = require("mongoose");

const index = require("./routes/index");
const blogs = require("./routes/blogs");
const comments = require("./routes/comments");

require("dotenv").config({ path: __dirname + "/.env" });

const url = process.env.DATABASEURL || "mongodb://localhost/restful_blog_app";

const port = process.env.PORT || 5080;

mongoose
  .connect(url, { useNewUrlParser: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.log(err));
mongoose.set("useFindAndModify", false);

app.set("view engine", "ejs");

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressSanitizer()); //has to go after bodyParser
app.use(methodeOverride("_method")); //url we using in edit page is _method

app.use(
  require("express-session")({
    secret: "secret",
    resave: false,
    saveUninitialized: false
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next) {
  res.locals.currentUser = req.user;
  next();
});

//Routes
app.use("/", index);
app.use("/blogs", blogs);
app.use("/blogs/:id/comments", comments);

app.listen(port, process.env.IP, function() {
  console.log("server started");
});
