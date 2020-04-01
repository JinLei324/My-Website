'use strict'
const logger = require('winston');
const elasticClient = require('../elasticSearch');
const tablename = 'stores';
const indexName = process.env.ElasticFranchiseIndex;
const version = 382;


function Select(data, callback) {
    elasticClient.get().search({
        index: indexName,
        type: tablename,
        body: {
            "query": {
                "match": data
            }
        }
    }, function (err, result) {
        callback(err, result);
    });
}
function SelectAll(callback) {
    elasticClient.get().search({
        index: indexName,
        type: tablename,
        body: {
            "query": {
                "match_all": {}
            }
        }
    }, function (err, result) {
        callback(err, result);
    });
}

function Insert(data, callback) {
    let _id = "" + data._id;
    delete data._id;
    elasticClient.get().index({
        index: indexName,
        type: tablename,
        id: _id,
        body: data
    }, (err, result) => {
        callback(err, result);
    });
}

function UpdateWithPush(_id, field, value, callback) {

    elasticClient.get().update({
        index: indexName,
        type: tablename,
        id: _id,
        retry_on_conflict: 5,
        body: {
            "script": "ctx._source." + field + ".add('" + value + "')"
        }
    }, (err, results) => {
        callback(err, results)
    })
}

function UpdateWithPull(_id, field, value, callback) {

    elasticClient.get().update({
        index: indexName,
        type: tablename,
        id: _id,
        retry_on_conflict: 5,
        body: {
            "script": "ctx._source." + field + ".remove(ctx._source." + field + ".indexOf('" + value + "'))"
        }
    }, (err, results) => {
        callback(err, results);
    })
}

function Update(_id, data, callback) {

    elasticClient.get().update({
        index: indexName,
        type: tablename,
        id: _id,
        retry_on_conflict: 5,
        body: {
            doc: data,
            doc_as_upsert: true
        }
    }, (err, results) => {
        callback(err, results)
    })
}

function updateByQuery(data, condition, callback) {
    elasticClient.get().updateByQuery({
        index: indexName,
        type: tablename,
        version: version,
        body: {
            query: {
                match:
                { "term": { "userId": "59bb9b3ed5e9cb3fed133b72" } },
                "script": { "inline": "ctx._source.currentlyActive = false" }
            },
        }
    }, (err, results) => {
        callback(err, results)
    })
}

function Delete(condition, callback) {
    elasticClient.get().deleteByQuery({
        index: indexName,
        type: tablename,
        version: version,
        body: {
            query: {
                match: condition
            }
        }
    }, (err, results) => {
        callback(err, results)
    })
}


// function getStoreProductDataElastic(data, callback) {
//     elasticClient.get().msearch({
//         index: indexName,
//         type: tablename,
//         body: [
//             { "type": "stores" },
//             {
//                 "query": {
//                     "bool": {
//                         "must": [
//                             {
//                                 "match_phrase_prefix": {
//                                     "name": data.name
//                                 }
//                             },
//                             {
//                                 "match":
//                                 {
//                                     "serviceZones": data.zoneId
//                                 }
//                             }
//                         ],
//                         "filter": {
//                             "geo_distance": {
//                                 "distance": "100000km",
//                                 "coordinates": {
//                                     "lat": data.lat,
//                                     "lon": data.long
//                                 }
//                             }
//                         }
//                     }
//                 },
//                 "sort": [
//                     {
//                         "_geo_distance": {
//                             "coordinates": {
//                                 "lat": data.lat,
//                                 "lon": data.long
//                             },
//                             "order": "asc",
//                             "unit": "km",
//                             "distance_type": "plane"
//                         }
//                     }
//                 ],
//                 "_source": ["name", "businessAddress", "sort", "images", "mongoId", "freeDeliveryAbove"], "from": 0, "size": 30
//             },
//             { "type": "childProducts" },
//             {
//                 "query": {
//                     "bool": {
//                         "must": [
//                             {
//                                 "match_phrase_prefix":
//                                 {
//                                     "productName": data.name
//                                 }
//                             }
//                         ]
//                     }
//                 },
//                 "_source": ["THC", "CBD", "productName", "price", "storeId", "thumbImage", "mobileImage", "parentProductId", "upc", "sku", "currency", "mongoId",
//                     "priceValue"], 
//                     "from": 0,
//                      "size": 30
//             }
//         ]
//     }, (err, result) => {

//         result.responses[0] = (result.responses[0].hits.total) ? result.responses[0].hits.hits : [];
//         result.responses[1] = (result.responses[1].hits.total) ? result.responses[1].hits.hits : [];
//         callback(err, result ? result.responses : []);
//     });
// }



/** 
* @function
* @name getStoreProductDataElastic 
* @param {object} data - data coming from controller
*/
const getStoreProductDataElastic = (data, callback) => {

    elasticClient.get().msearch({
        index: indexName,
        type: tablename,
        body: [
            { "type": "stores" },
            {
                "query": {
                    "bool":
                    {
                        "must": [
                            {
                                "match_phrase_prefix": {
                                    "name": data.name
                                }
                            }
                        ],
                        "should": [
                            {
                                "match":
                                {
                                    "serviceZones": data.zoneId
                                }
                            },
                            {
                                "match":
                                {
                                    "businessZoneId": data.zoneId
                                }
                            }
                        ],
                        "minimum_should_match": 1,
                        "filter": {
                            "geo_distance": {
                                "distance": "100000km",
                                "location": { "lat": data.lat, "lon": data.long }
                            }
                        }
                    }
                },
                "sort": [{
                    "_geo_distance":
                    {
                        "location":
                        {
                            "lat": data.lat,
                            "lon": data.long
                        },
                        "order": "asc",
                        "unit": "km",
                        "distance_type": "plane"
                    }
                }],
                "_source": ["name", "businessAddress", "sort", "logoImage", "_id", "freeDeliveryAbove"],
                "from": 0,
                "size": 30
            },
            { "type": "childProducts" },
            {
                "query": {
                    "bool": {
                        "must": [{ "match_phrase_prefix": { "productName": data.name } }]
                    }
                },

    "aggs": {
        "group_by_country": {
            "terms": { "field": "storeId" },
            "aggs": {
                "average_balance": {
                    "avg": {
                        "field": "THC"
                    }
                }
            }
        }
    },
    //   "aggs" : {
    //     "titles" : {
    //         "terms" : { "field" : "storeId" },
    //         "aggs": {
    //             "ids": {
    //                 "terms": { "field" : "seqId" }
    //             }
    //         }
    //     }
    // },
               
//   "aggs":{
//     "group_by_storeId":{
//       "terms": {
//         "field": "storeId.keyword",
//         //"size": 10
//       },
//     //   "aggs": {
//     //     "tops": {
//     //       "top_hits": {
//     //         "size": 10
//     //       }
//     //     }
//     //   }
//     }
//   },
                "_source": ["THC", "CBD", "productName", "price", "storeId", "thumbImage", "mobileImage", "parentProductId", "upc", "sku", "currency", "_id",
                    "priceValue"],
                "from": 0,
                "size": 30
            }
        ]
    }, (err, result) => {
        // result.responses[0] = (result.responses[0].hits.total) ? result.responses[0].hits.hits : [];
        // result.responses[1] = (result.responses[1].hits.total) ? result.responses[1].hits.hits : [];
        callback(err, result)//result ? result.responses : []);
    });
}

module.exports = { Select, SelectAll, Insert, Update, updateByQuery, Delete, UpdateWithPush, UpdateWithPull, getStoreProductDataElastic };