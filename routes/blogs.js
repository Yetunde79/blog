const express = require("express");
const router = express.Router();
const Blog = require("../models/blog");

// CREATE ROUTE
router.post("/", function(req, res) {
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
router.get("/:id", function(req, res) {
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
router.get("/:id/edit", function(req, res) {
  Blog.findById(req.params.id, function(err, foundBlog) {
    if (err) {
      res.redirect("/");
    } else {
      res.render("blogs/edit", { blog: foundBlog });
    }
  });
});

//UPDATE ROUTE
router.put("/:id", function(req, res) {
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
router.delete("/:id", function(req, res) {
  Blog.findByIdAndRemove(req.params.id, function(err) {
    //destroy blog
    if (err) {
      res.redirect("/"); //redirect
    } else {
      res.redirect("/");
    }
  });
});

module.exports = router;
