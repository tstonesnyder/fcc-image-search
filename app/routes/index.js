'use strict';

console.log('running ./routes/index.js');
// This will NOT end in a '/':
var appCWD = process.cwd();
console.log(`index.js: appCWD = ${appCWD}`);

var searchHandler = require('../controllers/searchHandler.server.js');

module.exports = function (app) {
  // ROOT PATH: send the instructions for using this api:
  app.route('/')
    .get(function (req, res) {
      res.sendFile(appCWD + '/public/instructions.html');
    });

  // User is initiating a search:
  // (This accepts any query params. It only uses 'offset', ignores others.)
  app.route('/api/imagesearch/:searchTerm')
    .get(searchHandler.newImageSearch);
  
  // User wants list of recent searches:
  // (This accepts any query params. Ignores them all.)
  app.route('/api/latest/imagesearch')
    .get(searchHandler.getLatestSearches);
  
  // Added this for my own use.
  app.route('/api/searchbydate/:searchTerm')
    .get(searchHandler.newSearchByDate);

  // Add a Health Check Path that always returns a 200 OK response (for use by Render):
  app.route('/health')
  .get(function (req, res) {
    console.log(`Request for health check from: ${req.ip}`);
    res.status(200).send('Ok');
  });

  // Trying to go to some other page:
  app.route('*')
    .get(function (req, res) {
      console.log(`Request for invalid path: ${req.path}`);
      res.status(404).sendFile(appCWD + '/public/404.html');
    });

  // Error handling
  app.use(function(err, req, res, next) {
    if (app.get('env') === 'development') {
      // DEVELOPMENT ERROR HANDLING:
      
      // in case of specific URIError
      if (err instanceof URIError) {
        err.message = 'Failed to decode param: ' + req.url;
        err.status = err.statusCode = 400;

        return res.json({'error': err.message});
        //return res.redirect(['https://', req.get('Host'), req.url].join(''));
      } else {
        console.error(err);

        // 500 = Internal Server Error
        // Show the error status, error message, and stack trace.
        res.status(err.status || 500);
        res.json({ message: err.message, error: err });
        // Render an error page, ASSUMING that a template engine is plugged in:
        // res.render('error', { message: err.message, error: err });
        // or render a static page:
        //res.render('500.html');
        // or
        //res.redirect('/public/500.html')
      }
    } else {
      // PRODUCTION ERROR HANDLING:
      console.error(err);
      res.status(500).send({status:500, message: 'internal error', type: 'internal'}); 
    }
  });
};