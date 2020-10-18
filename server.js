'use strict';

console.log('running server.js');

// Express.js:
var express = require('express');
var app = express();


console.log(`server.js: app.settings.env: ${app.settings.env}`);
if (app.settings.env === 'development') {
  // ONLY NEED THIS IN DEV (on Heroku will store these)
  // I THINK THE LINE BELOW WAS FOR THE OLD CLOUD9?
  // require('dotenv').config({path: '/home/ubuntu/private/.env-image-search'});

  /*  USING dotenv: 
      Create a .env file in the root directory of your project. 
      Add environment-specific variables on new lines in the form of NAME=VALUE. 
      config() (alias load()) will read your .env file, parse the contents, 
      assign it to process.env, and return an Object with a parsed key containing the loaded content or an error key if it failed.
  */
  require('dotenv').config();
}
if (!process.env.GOOGLE_SEARCH_API_KEY || !process.env.GOOGLE_SEARCH_ENGINE_ID || !process.env.DB_URL) {
  console.error('ERROR: Missing environment variables!');
  console.dir (process.env);
  process.exit(1);
}
// Use the port that Heroku provides or default to 8080 (for Cloud9):
var port = process.env.PORT || 8080;


// For communicating with MongoDB:
var mongoose = require('mongoose');
var dbConnectOptions = { useNewUrlParser: true, useUnifiedTopology: true };
mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true }, function (err) {
  if (err) {
    console.error('ERROR: Could not connect to MongoDB');
    throw err;
  }
  console.log('server.js: Connected to MongoDB');
});
// OTHER WAYS of doing error handling: https://mongoosejs.com/docs/connections.html#error-handling

// try {
//   await mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true });
//   console.log('server.js: Connected to MongoDB');
// } catch (err) {
//   console.error('ERROR: Could not connect to MongoDB');
//   throw err;
// }
// var dbConnectOptions = { useNewUrlParser: true, useUnifiedTopology: true };
// mongoose.connect(process.env.DB_URL, dbConnectOptions).
//   catch(err => {
//     console.error('ERROR: Could not connect to MongoDB!');
//     throw err;
//   })

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

