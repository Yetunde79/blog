var http = require("http");
setInterval(function() {
    http.get("http://yettifood.com");
}, 300000); 