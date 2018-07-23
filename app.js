var express               = require('express'),
    app                   = express(),
    expressSanitizer      = require('express-sanitizer'), //remove js script from code
    methodeOverride       = require('method-override'),
    bodyParser            = require('body-parser'),
    passport              = require('passport'),
    LocalStrategy         = require('passport-local'),
    passportLocalMongoose = require('passport-local-mongoose'),
    User                  = require("./models/user"),
    Blog                 = require("./models/blog"),
    mongoose              = require('mongoose');
   
 var url =  process.env.DATABASEURL || "mongodb://localhost/restful_blog_app"; 
 mongoose.connect(url);


app.set('view engine', 'ejs');

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressSanitizer());   //has to go after bodyParser
app.use(methodeOverride("_method"));  //url we using in edit page is _method

app.use(require("express-session")({
    secret: "secret",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate())); 
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//RESTFUL ROUTES
app.get("/", function(req, res){
    res.redirect("/blogs");
});

// INDEX ROUTE
app.get("/blogs", function(req, res){
   Blog.find({}, function(err, blogs){
       if(err){
           console.log("ERROR!");
       } else {
          res.render("index", {blogs: blogs}); 
       }
   });
});


//NEW ROUTE
app.get("/blogs/new", isLoggedIn, function(req, res){
    res.render("new");
});

// CREATE ROUTE
app.post("/blogs", function(req, res){
    req.body.blog.body = req.sanitize(req.body.blog.body);  //sanitizes the blog body which is the content, name is blog[body]
    // create blog
    Blog.create(req.body.blog, function(err, newBlog){ //req.body everything 4rm form. req.body.blog: it contains everything in blog array,  e.g blog[title], so it creates blog with that info
        if(err){
            res.render("new");
        } else {
            //then, redirect to the index
            res.redirect("/blogs");
        }
    });
});

//SHOW ROUTE
app.get("/blogs/:id", function(req, res){
   Blog.findById(req.params.id, function(err, foundBlog){
       if(err){
           res.redirect("/blogs")
       }
       else{
           res.render("show", {blog: foundBlog})
       }
   })
});

//EDIT ROUTE
app.get("/blogs/:id/edit", function(req, res){
     Blog.findById(req.params.id, function(err, foundBlog){
       if(err){
           res.redirect("/blogs")
       }
       else{
           res.render("edit", {blog: foundBlog})
       }
   })
});

//UPDATE ROUTE
app.put("/blogs/:id" , function(req,res){
    req.body.blog.body = req.sanitize(req.body.blog.body); //sanitize b4 update
   Blog.findByIdAndUpdate(req.params.id, req.body.blog, function(err, UpdatedBlog){  // Blog.findByIdAndUpdate(id, newData, callback)
       if(err){
           res.redirect("/blogs");
       }
       else{
           res.redirect("/blogs/" + req.params.id)   //to add to url use "+", updates to page with right id
       }
    
   });    
});

//DELETE ROUTE
app.delete("/blogs/:id",function(req, res){
    Blog.findByIdAndRemove(req.params.id,  function(err){ //destroy blog
       if(err){
           res.redirect("/blogs"); //redirect
       }
       else{
            res.redirect("/blogs");
        }
    });
});


//register
app.get("/register", function(req, res) {
    res.render("register");
});

app.post("/register", function(req,res){
    req.body.username
    req.body.password
    User.register(new User({username: req.body.username}), req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render("register"); //if error go back to register
        }
        passport.authenticate("local")(req, res, function(){ //local strategy, can be changed to another eg twitter
            res.redirect("/blogs/new"); //once registered you go to secret page
        })
    });
});


//Login Route
app.get("/login", function(req, res) {
    res.render("login");
});

//login logic
//middleware
app.post("/login",passport.authenticate("local", { //passp.auth goes btwn route & function(req, res). Its a middleware. Runs immediately after getting request
    successRedirect: "/blogs/new", //if succesfull
    failureRedirect: "/login"   //if failed
    }) ,function(req, res) {
    
});

//Logout Route
app.get("/logout", function(req, res) {
    req.logout();    //logout is a fun from passport
    res.redirect("/") //redirects to homepage
});

function isLoggedIn(req, res, next){  //to check if user is logged in. its a middleware, next refers to object called next
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}
//end of reg

app.listen(process.env.PORT, process.env.IP, function(){
    console.log("server started");
});