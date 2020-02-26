var express = require("express"),
  app = express(),
  expressSanitizer = require("express-sanitizer"), //remove js script from code
  methodeOverride = require("method-override"),
  bodyParser = require("body-parser"),
  request = require("request"),
  passport = require("passport"),
  LocalStrategy = require("passport-local"),
  User = require("./models/user"),
  Blog = require("./models/blog"),
  Comment = require("./models/comment"),
  nodemailer = require("nodemailer"),
  alert = require("alert-node"),
  mongoose = require("mongoose");

require("dotenv").config({ path: __dirname + "/.env" });

var url = process.env.DATABASEURL || "mongodb://localhost/restful_blog_app";

var port = process.env.PORT || 5080;
// seedDB();
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

// INDEX ROUTE
app.get("/", function(req, res) {
  Blog.find({}, function(err, blogs) {
    if (err) {
      console.log("ERROR!");
    } else {
      res.render("blogs/index", { blogs: blogs });
    }
  });
});

//NEW ROUTE
app.get("/new", isLoggedIn, function(req, res) {
  res.render("blogs/new");
});

//ABOUT ROUTE
app.get("/about", function(req, res) {
  res.render("blogs/about");
});

//CONTACT ROUTE
app.get("/contact", function(req, res) {
  res.render("blogs/contact");
});

// CREATE ROUTE
app.post("/blogs", function(req, res) {
  // create blog
  Blog.create(req.body.blog, function(err, newBlog) {
    //req.body everything 4rm form. req.body.blog: it contains everything in blog array,  e.g blog[title], so it creates blog with that info
    if (err) {
      res.render("blogs/new");
    } else {
      //then, redirect to the index
      res.redirect("/");
    }
  });
});

//SHOW ROUTE
app.get("/blogs/:id", function(req, res) {
  Blog.findById(req.params.id)
    .populate("comments")
    .exec(function(err, foundBlog) {
      if (err) {
        res.redirect("/");
      } else {
        var date = req.body.date;
        res.render("blogs/show", { blog: foundBlog });
      }
    });
});

//EDIT ROUTE
app.get("/blogs/:id/edit", function(req, res) {
  Blog.findById(req.params.id, function(err, foundBlog) {
    if (err) {
      res.redirect("/");
    } else {
      res.render("blogs/edit", { blog: foundBlog });
    }
  });
});

//UPDATE ROUTE
app.put("/blogs/:id", function(req, res) {
  Blog.findByIdAndUpdate(req.params.id, req.body.blog, function(
    err,
    UpdatedBlog
  ) {
    // Blog.findByIdAndUpdate(id, newData, callback)
    if (err) {
      res.redirect("/");
    } else {
      res.redirect("/blogs/" + req.params.id); //to add to url use "+", updates to page with right id
    }
  });
});

//DELETE ROUTE
app.delete("/blogs/:id", function(req, res) {
  Blog.findByIdAndRemove(req.params.id, function(err) {
    //destroy blog
    if (err) {
      res.redirect("/"); //redirect
    } else {
      res.redirect("/");
    }
  });
});

////////////
///COMMENTS ROUTE
////////////

app.get("/blogs/:id/comments/new", function(req, res) {
  //find camo by id
  Blog.findById(req.params.id, function(err, blog) {
    if (err) {
      console.log(err);
    } else {
      res.render("comments/new", { blog: blog });
    }
  });
});

app.post("/blogs/:id/comments", function(req, res) {
  var secretKey = process.env.G_CAPTCHA;
  // req.connection.remoteddress will provide IP address of connected user.
  var verificationUrl =
    "https://www.google.com/recaptcha/api/siteverify?secret=" +
    secretKey +
    "&response=" +
    req.body["g-recaptcha-response"] +
    "&remoteip=" +
    req.connection.remoteAddress;

  if (
    req.body["g-recaptcha-response"] === undefined ||
    req.body["g-recaptcha-response"] === "" ||
    req.body["g-recaptcha-response"] === null
  ) {
    alert("Please select captcha");
  } else {
    request(verificationUrl, function(error, response, body) {
      body = JSON.parse(body);
      if (body.success !== undefined && !body.success) {
        alert("Failed captcha verification");
      } else {
        //lookup blog with id, create new comment, connect comment to blog, redirect to blog showpage
        Blog.findById(req.params.id, function(err, blog) {
          if (err) {
            console.log(err);
          } else {
            Comment.create(req.body.comment, function(err, comment) {
              if (err) {
                console.log(err);
              } else {
                blog.comments.push(comment);
                blog.save();
                res.redirect("/blogs/" + blog._id);
              }
            });
          }
        });
      }
    });
  } //end else
});

// COMMENT EDIT ROUTE
app.get("/comment/:comment_id/edit", function(req, res) {
  Comment.findById(req.params.comment_id, function(err, foundComment) {
    if (err) {
      res.redirect("/");
    } else {
      res.render("comments/edit", { comment: foundComment });
    }
  });
});

// COMMENT UPDATE
app.put("/comment/:comment_id", function(req, res) {
  Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(
    err,
    updatedComment
  ) {
    if (err) {
      res.redirect("/");
    } else {
      res.redirect("/blogs/" + req.params.id);
    }
  });
});

// COMMENT DESTROY ROUTE
app.delete("/blogs/:id/comment/:comment_id", function(req, res) {
  //findByIdAndRemove
  Comment.findByIdAndRemove(req.params.comment_id, function(err) {
    if (err) {
      res.redirect("/");
    } else {
      res.redirect("/blogs/" + req.params.id);
    }
  });
});

//comment end

//register
app.get("/register", function(req, res) {
  res.render("register");
});

app.post("/register", function(req, res) {
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
app.get("/login", function(req, res) {
  res.render("login");
});

//login logic
//middleware
app.post(
  "/login",
  passport.authenticate("local", {
    //passp.auth goes btwn route & function(req, res). Its a middleware. Runs immediately after getting request
    successRedirect: "/", //if succesfull
    failureRedirect: "/login" //if failed
  }),
  function(req, res) {}
);

//Logout Route
app.get("/logout", function(req, res) {
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
//end of reg

app.listen(port, process.env.IP, function() {
  console.log("server started");
});
