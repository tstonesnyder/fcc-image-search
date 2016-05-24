'use strict';
var https = require('https');
var Searches = require('../models/searches.js');

const baseHttpReqStr = `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_SEARCH_API_KEY}&cx=${process.env.GOOGLE_SEARCH_ENGINE_ID}`;

console.log('running ./app/controllers/searchHandler.server.js');

function searchHandler () {
  
  var newImageSearch = function (req, res, next) {
    var userIp = req.ip;
    var searchTerm = req.params.searchTerm;
    // var offset = req.query ? req.query.offset : undefined;
    var startIndex = req.query.offset || 1;
    console.log(`Request from IP ${userIp} to search IMAGES for ${searchTerm} starting at ${startIndex}.`);

    // const fields = 'searchInformation/formattedTotalResults,queries/request/startIndex,items(title,link,snippet,image/contextLink,image/byteSize,image/thumbnailLink)';
    const fields = 'items(link,snippet,image/contextLink,image/byteSize,image/thumbnailLink)';
    const httpReqStr = `${baseHttpReqStr}&userIP=${userIp}&searchType=image&safe=medium&fields=${fields}&num=10&start=${startIndex}&q=${searchTerm}`;

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
            if (err) {return next(err);}
            
            console.log(`  Added to db: '${newDoc.search_string}' on ${newDoc.date_created}`);
            return;
          });

        })
        .on('error', (e) => {
          console.error(`  Error receiving data: ${e.message}`);
          console.error(e);
          return res.json({'error': `Error receiving data: ${e.message}`});
        });
    })
    .on('error', (e) => {
      console.error(`  Error from GET request: ${e.message}`);
      console.error(e);
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
        { $limit: 10 },
        // NOTE: We don't get error if it doesn't find these fields.
        { $project: { 'term': '$search_string', 'when': '$date_created', _id: false } },
        function (err, result) {
          if (err) {return next(err);}
          
          if (!result || result.length === 0) {
            console.log('No searches found in db.');
            return res.json({});
          }
          
          return res.json(result);
        }
      );
  };
  
  var newSearchByDate = function (req, res, next) {
    const appBaseUrl = req.protocol + "://" + req.get('host');
    const userIp = req.ip;
    const searchTerm = req.params.searchTerm;
    // Default to 365 days if not specified
    const nbrDays = 'd' + (req.query.days || 365);
    const fields = req.query.showall ? '' : '&fields=searchInformation/formattedTotalResults,items(title,link,snippet)';
    var startIndex = req.query.offset || 1;  // will change this below
    // Added host language = english, and sort by date
    const httpReqStr = `${baseHttpReqStr}&hl=en&sort=date&userIP=${userIp}&safe=medium${fields}&num=10&q=${searchTerm}&dateRestrict=${nbrDays}&start=${startIndex}`;
    // NOTE: num must be 1-10
    console.log(`Request from IP ${userIp} to search by date (${nbrDays}) for ${searchTerm} starting at ${startIndex}.`);
    console.log(httpReqStr);

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
            return res.json(responseObj);
          } else {
            // Do NOT store this search in the DB.
            // But DO provide a link at bottom to the next query.
            const regEx = /offset=(\d+)/i;
            if (!req.originalUrl.match(regEx)) {
              console.log(req.query);
              if (Object.keys(req.query).length === 0) {
                // No query string (query is an empty object), so use '?'
                responseObj.next = `${appBaseUrl}${req.originalUrl}?offset=11`;
              } else {
                responseObj.next = `${appBaseUrl}${req.originalUrl}&offset=11`;
              }
            } else {
              responseObj.next = `${appBaseUrl}${req.originalUrl.replace(regEx, (str, nbr) => `offset=${+nbr + 10}`)}`;
            }
            return res.json(responseObj);
          }
        })
        .on('error', (e) => {
          console.error(`  Error receiving data: ${e.message}`);
          console.error(e);
          return res.json({'error': `Error receiving data: ${e.message}`});
        });
    })
    .on('error', (e) => {
      console.error(`  Error from GET request: ${e.message}`);
      console.error(e);
      return res.json({'error': `Error from GET request: ${e.message}`});
    });
  };


  return {
    newImageSearch: newImageSearch,
    getLatestSearches: getLatestSearches,
    newSearchByDate: newSearchByDate
  };
}

// Export the returned object from above:
module.exports = searchHandler();