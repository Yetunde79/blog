var express               = require('express'),
    app                   = express(),
    expressSanitizer      = require('express-sanitizer'), //remove js script from code
    methodeOverride       = require('method-override'),
    bodyParser            = require('body-parser'),
    mongoose              = require('mongoose');
   
 var url =  process.env.DATABASEURL || "mongodb://localhost/restful_blog_app"; 
 mongoose.connect(url);


app.set('view engine', 'ejs');

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressSanitizer());   //has to go after bodyParser
app.use(methodeOverride("_method"));  //url we using in edit page is _method

//MONGOOSE/MODEL CONFIG
var blogSchema = new mongoose.Schema({
    title: String,
    image: String,
    body: String,
    created: {type: Date, default: Date.now}
});

var Blog = mongoose.model("Blog", blogSchema);


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
app.get("/blogs/new", function(req, res){
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

app.listen(process.env.PORT, process.env.IP, function(){
    console.log("server started");
});