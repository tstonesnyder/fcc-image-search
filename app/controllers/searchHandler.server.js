'use strict';
var https = require('https');

// var Urls = require('../models/urls.js');

// Use the revealing module pattern:
function searchHandler () {
  
  var newSearch = function (req, res) {
    //var appBaseUrl = req.protocol + "://" + req.get('host');
    // console.log(`appUrl = ${appBaseUrl}`);
    // http://clem-tutorial-beg-tstonesnyder.c9users.io
    // http://fcc-api-urlshortener.herokuapp.com

    var userIp = req.ip;
    var searchTerm = req.params.searchTerm;
    // var offset = req.query ? req.query.offset : undefined;
    var startIndex = req.query.offset || 1;
    console.log(`Request from IP ${userIp} to search for ${searchTerm} starting at ${startIndex}.`);

    // &start=starIndex
    // const fields = 'searchInformation/formattedTotalResults,queries/request/startIndex,items(title,link,snippet,image/contextLink,image/byteSize,image/thumbnailLink)';
    const fields = 'items(link,snippet,image/contextLink,image/byteSize,image/thumbnailLink)';
    const httpReqStr = `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_SEARCH_API_KEY}&cx=${process.env.GOOGLE_SEARCH_ENGINE_ID}&userIP=${userIp}&searchType=image&safe=medium&fields=${fields}&num=10&start=${startIndex}&q=${searchTerm}`;
    //console.log(httpReqStr);

    // Request search results from the Google Custom Search API:
    // This defaults to returning data in JSON format.
    // Returns an instance of the http.ClientRequest class (a writable stream, which emit events).
    https.get(httpReqStr, (apiRes) => {
      var totalResponse = "";
      var nbrChunksSent = 0;
      
      console.log(`  API response status code: ${apiRes.statusCode}`);
      // Set this so the "data" event will emit Strings rather than Node Buffer objects:
      apiRes.setEncoding('utf8')
        .on('data', (chunk) => {
          //console.log(`BODY: ${chunk}`);
          nbrChunksSent++;
          totalResponse += chunk;
        })
        .on('end', function () {
          console.log(`  Response length: ${totalResponse.length}, nbr chunks sent: ${nbrChunksSent}`);
          // 'totalResponse' will be a string of JSON: 
          // containing either an empty object '{}\n',
          // or an object with an 'items' property whose value is an array of objects.
          var responseObj = JSON.parse(totalResponse);
          if (!responseObj.items) {
            // No results
            return res.json({'error': 'No results found'});
          } else {
            // Reformat the data
            let formattedItems = [];
            responseObj.items.forEach((i) => {
              let item = {
                link: i.link,
                snippet: i.snippet,
                size: i.image.byteSize,
                thumbnailLink: i.image.thumbnailLink,
                contextLink: i.image.contextLink
              };
              formattedItems.push(item);
            });
            return res.json(formattedItems);
          }
        })
        .on('error', (e) => {
          console.error(`  Error receiving data: ${e.message}`);
          return res.json({'error': `Error receiving data: ${e.message}`});
        });
    })
    .on('error', (e) => {
      console.error(`  Error from GET request: ${e.message}`);
      return res.json({'error': `Error from GET request: ${e.message}`});
    });
    
    // var urlNbr;
    // var urlInfoToReturn = {
    //   original_url: url,
    //   short_url: ''
    // };
    
    // Urls
    //   // CHECK IF THE URL ALREADY EXISTS IN DB:
    //   .findOne({ 'url': url}, { 'url_nbr': true, '_id': false })
    //   .exec(function (err, result) {
    //     if (err) { throw err; }
        
    //     if (result) {
    //       // url already exists in db, so just get its urlNbr
    //       urlInfoToReturn.short_url = appBaseUrl + '/' + result.url_nbr;
    //       console.log(`addUrl: URL already stored as urlNbr ${result.url_nbr}`);
    //       return res.json(urlInfoToReturn);
    //     }
        
    //     // ADD THIS URL TO THE DB:
    //     Urls
    //       // Get the max urlNbr in the db:
    //       // NOTE: With find().limit(1) an array of the 1 doc is returned.
    //       .find({}, { 'url_nbr': true, '_id': false })
    //       .sort({ url_nbr: -1 })
    //       .limit(1)
    //       .exec(function (err, result) {
    //         if (err) { throw err; }
            
    //         if (!result || result.length === 0) {
    //           // No docs in the db yet, so start w/ 1.
    //           urlNbr = 1;
    //         } else {
    //           // Increment the max nbr by 1
    //           urlNbr = result[0].url_nbr + 1;
    //         }

    //         // Create a new document using our Url model:
    //         var newDoc = new Urls({
    //           'url_nbr': urlNbr,
    //           'url': url
    //         });
            
    //         // Insert the new doc to the db
    //         newDoc.save(function (err, doc) {
    //           if (err) { throw err; }
              
    //           urlInfoToReturn.short_url = appBaseUrl + '/' + urlNbr;
    //           console.log(`addUrl: Added URL to db with short_url = ${urlInfoToReturn.short_url}`);
    //           return res.json(urlInfoToReturn);
    //         });
    //       });
    //   });
  };

  
  var getLatestSearches = function (req, res) {
  };
  // // Get a url from the db:
  // var getUrl = function (req, res) {
  //   var urlNbr = req.params[0];
  //   console.log(`getUrl: User request to goto URL nbr ${urlNbr}`);

  //   Urls
  //     .findOne({ 'url_nbr': urlNbr}, { 'url': true, '_id': false })
  //     .exec(function (err, result) {
  //       if (err) {
  //         throw err;
  //       }
        
  //       if (!result) {
  //         console.log(`getUrl: No such URL nbr ${urlNbr}. About to return error json.`);
  //         return res.json({ 'error': 'Invalid url nbr' });
  //       }
        
  //       return res.redirect(result.url);
  //     });
  // };
  
  return {
    newSearch: newSearch,
    getLatestSearches: getLatestSearches
  };
}

// Export the returned object from above:
module.exports = searchHandler();