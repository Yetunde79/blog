const express = require("express");
const router = express.Router({ mergeParams: true });
const Blog = require("../models/blog");
const Comment = require("../models/comment");
const request = require("request");
const alert = require("alert-node");

router.get("/new", function(req, res) {
  //find camo by id
  Blog.findById(req.params.id, function(err, blog) {
    if (err) {
      console.log(err);
    } else {
      res.render("comments/new", { blog: blog });
    }
  });
});

router.post("/", function(req, res) {
  var secretKey = process.env.G_CAPTCHA;
  // req.connection.remote address will provide IP address of connected user.
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
router.get("/:comment_id/edit", function(req, res) {
  Comment.findById(req.params.comment_id, function(err, foundComment) {
    if (err) {
      res.redirect("/");
    } else {
      res.render("comments/edit", {
        blog_id: req.params.id,
        comment: foundComment
      });
    }
  });
});

// COMMENT UPDATE
router.put("/:comment_id", function(req, res) {
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
router.delete("/:comment_id", function(req, res) {
  Comment.findByIdAndRemove(req.params.comment_id, function(err) {
    if (err) {
      res.redirect("/");
    } else {
      res.redirect("/blogs/" + req.params.id);
    }
  });
});

module.exports = router;
