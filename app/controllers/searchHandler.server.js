'use strict';
var https = require('https');

var Searches = require('../models/searches.js');

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
            // return res.json({'error': 'No results found'});
            // return res.json({});
            res.json({});
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
            // return res.json(formattedItems);
            res.json(formattedItems);
          }
          
          // Add this search the db:
          // Create a new document using our Search model:
          var newDoc = new Searches({
            'search_string': searchTerm,
            'user_ip': userIp
          });
          
          // Insert the new doc to the db
          newDoc.save(function (err, doc) {
            if (err) { throw err; }
            // console.log('  Added to db', newDoc);
            console.log(`  Added to db: '${newDoc.search_string}' on ${newDoc.date_created}`);
            return;
          });

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
  };

  var getLatestSearches = function (req, res, next) {
    console.log('Request to get 10 most recent searches');
    Searches
      // CAN'T RELABEL A FIELD WITH find()???
      // .find({}, { search_string: true, date_created: true, _id: false })
      // .sort({ $natural: -1 })
      // .limit(10)
      // .exec(function (err, result){
      //   if (err) {throw err;}
      //   if (!result || result.length === 0) {
      //     console.log('No searches found in db.');
      //     return res.json({});
      //   }
      //   return res.json(result);
      // });
      
      // $sort operator can take advantage of an index when placed at the beginning of the pipeline 
      // or placed BEFORE the $project, $unwind, and $group aggregation operators.
      // When a $sort immediately precedes a $limit in the pipeline, 
      // the $sort operation only maintains the top n results as it progresses.
      .aggregate(
        { $sort: { _id: -1 } },
        { $limit: 0 },
        // Don't get error if it doesn't find these fields.
        { $project: { 'term': '$search_stringx', 'when': '$date_created', _id: false } },
        function (err, result) {
          // if (err) {throw err;}
          if (err) {return next(err);}
          
          if (!result || result.length === 0) {
            console.log('No searches found in db.');
            return res.json({});
          }
          
          return res.json(result);
        }
      );
  };

  return {
    newSearch: newSearch,
    getLatestSearches: getLatestSearches
  };
}

// Export the returned object from above:
module.exports = searchHandler();