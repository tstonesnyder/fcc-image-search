'use strict';

console.log('running server.js');

// Express.js:
const express = require('express');
const app = express();


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
if (!process.env.GOOGLE_SEARCH_API_KEY || !process.env.GOOGLE_SEARCH_ENGINE_ID || !process.env.DB_URI) {
  console.error('ERROR: Missing environment variables!');
  console.dir (process.env);
  process.exit(1);
}
// Use the port that Heroku provides or default to 8080 (for Cloud9):
const port = process.env.PORT || 8080;


// For communicating with MongoDB:
const mongoose = require('mongoose');
const dbConnectOptions = {
  // https://mongoosejs.com/docs/deprecations.html
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
};
mongoose.connect(process.env.DB_URI, dbConnectOptions, function (err) {
  if (err) {
    // OTHER WAYS of doing error handling: https://mongoosejs.com/docs/connections.html#error-handling
    console.error('ERROR: Could not connect to MongoDB!');
    throw err;
  }
  console.log('server.js: Connected to MongoDB');
});

// Our code for handling routes:
const routes = require('./app/routes/index.js');

// This app will be running behind a proxy (at Cloud9 or at Heroku), 
// so set this to get the correct ip address,
// then it will use req.headers['x-forwarded-for']
// instead of req.connection.remoteAddress.
app.enable('trust proxy');

routes(app);
  
app.listen(port, function () {
  console.log('Listening on port ' + port + '...');
});

