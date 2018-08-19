var http = require("http");
setInterval(function() {
    http.get("http://code-blog.herokuapp.com");
}, 300000); 