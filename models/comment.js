var mongoose = require("mongoose");
 
var commentSchema = new mongoose.Schema({
    text: String,
    email: String,
    author: String,
    created_at: {type : Date, default: Date.now()}
});
 
module.exports = mongoose.model("Comment", commentSchema);