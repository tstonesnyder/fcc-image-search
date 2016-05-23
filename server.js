'use strict';

// Express.js:
var express = require('express');
// For communicating with MongoDB:
var mongoose = require('mongoose');
// Our code for handling routes:
var routes = require('./app/routes/index.js');

var app = express();

console.log(`app.settings.env: ${app.settings.env}`);
if (app.settings.env === 'development') {
  // ONLY NEED THIS IN DEV (on Heroku will store these)
  require('dotenv').config({path: '/home/ubuntu/private/.env-image-search'});
}

if (!process.env.GOOGLE_SEARCH_API_KEY || !process.env.GOOGLE_SEARCH_ENGINE_ID) {
  console.error('ERROR: Missing environment variables!');
  process.exit(1);
}

// Use the port that Heroku provides or default to 8080 (for Cloud9):
var port = process.env.PORT || 8080;

mongoose.connect(process.env.MONGO_URI);

// This app will be running behind a proxy (at Cloud9 or at Heroku), 
// so set this to get the correct ip address,
// then it will use req.headers['x-forwarded-for']
// instead of req.connection.remoteAddress.
app.enable('trust proxy');

routes(app);
  
app.listen(port, function () {
  console.log('Listening on port ' + port + '...');
});

