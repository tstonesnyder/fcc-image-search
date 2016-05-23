'use strict';

// This will NOT end in a '/':
var appCWD = process.cwd();
console.log(`appCWD = ${appCWD}`);

var searchHandler = require('../controllers/searchHandler.server.js');

module.exports = function (app) {
  // ROOT PATH: send the instructions for using this api:
  app.route('/')
    .get(function (req, res) {
      res.sendFile(appCWD + '/public/instructions.html');
    });
  
  // User is initiating a search:
  app.route('/api/imagesearch/:searchTerm')
    .get(searchHandler.newSearch);
  
  // User wants list of recent searchs:
  app.route('/api/latest/imagesearch')
    .get(searchHandler.getLatestSearches);

  // // Trying to create a url with invalid format:
  // app.route(['/new', '/new/*'])
  //   .get(function (req, res) {
  //     console.log(`Request for invalid path: ${req.path}`);
  //     res.json({ 'error': 'URL is invalid' });
  //   });
  
  // Trying to go to some other page:
  app.route('*')
    .get(function (req, res) {
      console.log(`Request for invalid path: ${req.path}`);
      res.status(404).sendFile(appCWD + '/public/404.html');
    });

  // app.use(function(err, req, res, next) {
  //     // in case of specific URIError
  //     if (err instanceof URIError) {
  //         err.message = 'Failed to decode param: ' + req.url;
  //         err.status = err.statusCode = 400;
  
  //         return res.json({'error': err.message});
  //         //return res.redirect(['https://', req.get('Host'), req.url].join(''));
  //     } else {
  //         // ..
  //         return res.json({'error': err.message});
  //     }
  //     // ..
// });
};