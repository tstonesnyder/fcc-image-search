'use strict';

// Express.js:
var express = require('express');
// For communicating with MongoDB:
// var mongoose = require('mongoose');
// Our code for handling routes:
var routes = require('./app/routes/index.js');

var app = express();

console.log(`app.settings.env: ${app.settings.env}`);
console.log(`process.env.NODE_ENV: ${process.env.NODE_ENV}`);
if (app.settings.env === 'development') {
  // ONLY NEED THIS IN DEV (on Heroku will store these)
  require('dotenv').config({path: '/home/ubuntu/private/.env-image-search'});
}

if (!process.env.GOOGLE_SEARCH_API_KEY || !process.env.GOOGLE_SEARCH_ENGINE_ID) {
  console.log('ERROR: Missing environment variables!');
  process.exit(1);
}


// Use the port that Heroku provides or default to 8080 (for Cloud9):
var port = process.env.PORT || 8080;

// RUNNING FROM DB ON CLOUD9 DATA DIR:
// var mongoUri = 'mongodb://localhost:27017/urlshortener';
// RUNNING FROM DB ON MLAB (set up by Heroku):
//var mongoUri = 'mongodb://heroku_19kjhcff:hov2a8gqmehlg6fko35nvgogsh@ds011883.mlab.com:11883/heroku_19kjhcff';

//mongoose.connect(process.env.MONGO_URI);
//mongoose.connect(mongoUri);

routes(app);
  
app.listen(port, function () {
  console.log('Listening on port ' + port + '...');
});

