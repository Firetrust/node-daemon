/**
 * Module dependencies.
 */

var http = require('http');

/**
 * Simple HTTP Server Example.
 */

http.createServer(function(req, res) {
  res.writeHead(200);
  res.end('Process ID: ' + process.pid);
}).listen(8080);
