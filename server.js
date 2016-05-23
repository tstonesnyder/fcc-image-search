'use strict';

console.log('running server.js');

// Express.js:
var express = require('express');
var app = express();


console.log(`server.js: app.settings.env: ${app.settings.env}`);
if (app.settings.env === 'development') {
  // ONLY NEED THIS IN DEV (on Heroku will store these)
  require('dotenv').config({path: '/home/ubuntu/private/.env-image-search'});
}
if (!process.env.GOOGLE_SEARCH_API_KEY || !process.env.GOOGLE_SEARCH_ENGINE_ID || !process.env.MONGODB_URI) {
  console.error('ERROR: Missing environment variables!');
  console.dir (process.env);
  process.exit(1);
}
// Use the port that Heroku provides or default to 8080 (for Cloud9):
var port = process.env.PORT || 8080;


// For communicating with MongoDB:
var mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI, function (err) {
  if (err) {
    console.error('ERROR: Could not connect to MongoDB');
    throw err;
  }
  console.log('server.js: Connected to MongoDB');
});


// Our code for handling routes:
var routes = require('./app/routes/index.js');

// This app will be running behind a proxy (at Cloud9 or at Heroku), 
// so set this to get the correct ip address,
// then it will use req.headers['x-forwarded-for']
// instead of req.connection.remoteAddress.
app.enable('trust proxy');

routes(app);
  
app.listen(port, function () {
  console.log('Listening on port ' + port + '...');
});

