'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'stores'
const ObjectID = require('mongodb').ObjectID;
const elasticClient = require('../elasticSearch');
const indexName = process.env.ElasticStoreIndex;
const logger = require('winston');
/** 
 * @function
 * @name getById 
 * @param {object} params - data coming from controller
 */
const getOneElastic = (params, callback) => {
    db.get().collection(tableName)
        .findOne(params, { firstCategory: 1, secondCategory: 1, thirdCategory: 1, workingHours: 1 }, (err, result) => {
            return callback(err, result);
        })
}
const getById = (params, callback) => {
    db.get().collection(tableName).findOne({
        _id: new ObjectID(params.id)
    }, {
        name: 1,
        businessPhone: 1,
        businessEmail: 1,
        businessAddress: 1,
        firstCategoryId: 1,
        secondCategoryId: 1,
        workingHours: 1,
        storeIsOpen: 1,
        storeImageUrl: 1,
        coordinates: 1,
        countryCode: 1,
        ownerPhone: 1,
        sName: 1,
        storeCoordinates: 1,
        StoreProfileLogo: 1,
        storeAddr: 1,
        addressCompo: 1,
        streetName: 1,
        localityName: 1,
        areaName: 1,
        storeType: 1,
        storeTypeMsg: 1,
        forcedAccept: 1,
        autoDispatch: 1,
        driverType: 1,
        isPackageEnable: 1

    }, (err, result) => {
        return callback(err, result);
    });
}
/** 
 * @function
 * @name isExist 
 * @param {object} params - data coming from controller
 */
const isExist = (params, callback) => {
    db.get().collection(tableName).findOne({
        _id: new ObjectID(params.id)
    }, {
        name: 1,
        sName: 1,
        storeaddress: 1,
        storeAddr: 1,
        addressCompo: 1,
        streetName: 1,
        localityName: 1,
        areaName: 1,
        storeBillingAddr: 1,
        coordinates: 1,
        freeDeliveryAbove: 1,
        businessAddress: 1,
        bannerLogos: 1,
        profileLogos: 1,
        bannerImage: 1,
        forcedAccept: 1,
        autoDispatch: 1,
        storeIsOpen: 1,
        driverType: 1,
        pricePerMile: 1,
        orderType: 1,
        pickupCash: 1,
        pickupCard: 1,
        deliveryCard: 1,
        deliveryCash: 1,
        businessRating: 1,
        commission: 1,
        commissionType: 1,
        commissionTypeMsg: 1,
        minimumOrder: 1,
        storeType: 1,
        storeTypeMsg: 1,
        cartsAllowed: 1,
        cartsAllowedMsg: 1,
        ownerName: 1,
        ownerEmail: 1,
        orderEmail: 1,
    }, (err, result) => {
        return callback(err, result);
    });
};
/** 
 * @function
 * @name create 
 * @param {object} params - data coming from controller
 */
const create = (data, callback) => {
    db.get().collection(tableName).insert(
        [data], (err, result) => {
            return callback(err, result);
        });
}
/** 
 * @function
 * @name getZonalCategoriesById 
 * @param {object} params - data coming from controller
 */
const getZonalSubSubCatByIdOld = (params, callback) => {
    let cond = [{
        $match: params
    }, {
        "$unwind": "$catWiseProductCount"
    }, {
        "$match": {
            "catWiseProductCount.count": {
                "$gt": 0
            }
        }
    }, {
        "$lookup": {
            "from": "firstCategory",
            "localField": "catWiseProductCount.firstCategoryId",
            "foreignField": "_id",
            "as": "firstCategoryData"
        }
    }, {
        "$unwind": "$firstCategoryData"
    }, {
        "$group": {
            "_id": "$firstCategoryData._id",
            "categoryName": {
                "$first": "$firstCategoryData.categoryName"
            },
            "categoryId": {
                "$first": "$firstCategoryData._id"
            },
            "imageUrl": {
                "$first": "$firstCategoryData.imageUrl"
            },
            "description": {
                "$first": "$firstCategoryData.categoryDesc"
            },
            "seqID": {
                "$first": "$firstCategoryData.seqID"
            },
            "visibility": {
                "$first": "$firstCategoryData.visibility"
            },
            // list: { "$first": "$firstCategoryData.list" },
            "subCatsToShow": {
                "$push": "$subCatWiseProductCount.secondCategoryId"
            }
        }
    }, {
        "$match": {
            "visibility": 1
        }
    }, {
        "$sort": {
            "seqID": 1
        }
    }, {
        "$lookup": {
            "from": "secondCategory",
            "localField": "categoryId",
            "foreignField": "categoryId",
            "as": "subCategories"
        }
    },
        //   { $unwind: "$subCategories" },
        //  { $lookup: { "from": "thirdCategory", "localField": "subCategories._id", "foreignField": "subCategoryId", "as": "subSubCategories" } }
    ];
    db.get().collection(tableName).aggregate(cond, ((err, result) => {
        return callback(err, result);
    }));
}
const getZonalSubSubCatById = (params, callback) => {
    // db.get().collection(tableName).findOne(params, (err, result) => {
    //     return callback(err, result);
    // });
    let cond = [{
        $match: params
    }, {
        "$unwind": "$firstCategory"
    },
    {
        "$project": {
            firstCategory: 1,
            secondCategory: 1,
        }
    }
    ];
    db.get().collection(tableName).aggregate(cond, ((err, result) => {
        return callback(err, result);
    }));
}
/** 
 * @function
 * @name getZonalCategoriesById 
 * @param {object} params - data coming from controller
 */
const getZonalCategoriesById = (params, callback) => {
    // let cond = [
    //     {
    //         $match: params
    //     },
    //     { $lookup: { "from": "firstCategory", "localField": "firstCategory", "foreignField": "_id", "as": "firstCategoryData" } },
    //     { $unwind: "$firstCategoryData" },
    //     {
    //         $group: {
    //             _id: "$firstCategoryData._id",
    //             categoryName: { "$first": "$firstCategoryData.name" },
    //             categoryId: { "$first": "$firstCategoryData._id" },
    //             imageUrl: { "$first": "$firstCategoryData.imageUrl" },
    //             description: { "$first": "$firstCategoryData.description" },
    //             seqID: { "$first": "$firstCategoryData.seqID" },
    //             visibility: { "$first": "$firstCategoryData.visibility" },
    //             list: { "$first": "$firstCategoryData.list" }
    //         }
    //     },
    //     { $match: { visibility: 1 } },
    //     { $sort: { seqID: 1 } },
    //     { $lookup: { "from": "secondCategory", "localField": "categoryId", "foreignField": "categoryId", "as": "subCategories" } }
    // ];
    let cond = [{
        $match: params
    },
    {
        $unwind: "$catWiseProductCount"
    },
    {
        $match: {
            "catWiseProductCount.count": {
                $gt: 0
            }
        }
    },
    {
        $lookup: {
            "from": "firstCategory",
            "localField": "catWiseProductCount.firstCategoryId",
            "foreignField": "_id",
            "as": "firstCategoryData"
        }
    }, {
        $unwind: "$firstCategoryData"
    }, {
        $group: {
            _id: "$firstCategoryData._id",
            categoryName: {
                "$first": "$firstCategoryData.categoryName"
            },
            categoryId: {
                "$first": "$firstCategoryData._id"
            },
            imageUrl: {
                "$first": "$firstCategoryData.imageUrl"
            },
            description: {
                "$first": "$firstCategoryData.categoryDesc"
            },
            seqID: {
                "$first": "$firstCategoryData.seqID"
            },
            visibility: {
                "$first": "$firstCategoryData.visibility"
            },
            // list: { "$first": "$firstCategoryData.list" },
            subCatsToShow: {
                "$push": "$subCatWiseProductCount"
            }
        }
    }, {
        $match: {
            visibility: 1
        }
    }, {
        $sort: {
            seqID: -1
        }
    }, {
        $lookup: {
            "from": "secondCategory",
            "localField": "categoryId",
            "foreignField": "categoryId",
            "as": "subCategories"
        }
    }];
    db.get().collection(tableName).aggregate(cond, ((err, result) => {
        return callback(err, result);
    }));
}
/** 
 * @function
 * @name getStoreCategoriesById 
 * @param {object} params - data coming from controller
 */
const getStoreCategoriesById = (params, callback) => {
    let cond = [{
        $match: {
            _id: params.id,
            status: 1
        }
    }, {
        $lookup: {
            "from": "firstCategory",
            "localField": "firstCategory",
            "foreignField": "_id",
            "as": "firstCategoryData"
        }
    }, {
        $unwind: "$firstCategoryData"
    }, {
        $group: {
            _id: "$firstCategoryData._id",
            categoryName: {
                "$first": "$firstCategoryData.name"
            },
            categoryId: {
                "$first": "$firstCategoryData._id"
            },
            imageUrl: {
                "$first": "$firstCategoryData.imageUrl"
            },
            description: {
                "$first": "$firstCategoryData.description"
            }
        }
    }, {
        $sort: {
            "firstCategoryData.seqID": 1
        }
    }, {
        $lookup: {
            "from": "secondCategory",
            "localField": "categoryId",
            "foreignField": "categoryId",
            "as": "subCategories"
        }
    }];
    db.get().collection(tableName).aggregate(cond, ((err, result) => {
        return callback(err, result);
    }));
}
/** 
 * @function
 * @name getAllStoresById 
 * @param {object} params - data coming from controller
 */
const getAllStoresById = (params, callback) => {

    db.get().collection(tableName).find({
        _id: {
            $in: params.id
        }
    }, {
        _id: 1,
        name: 1,
        imageUrl: 1,
        description: 1
    }).sort({
        seqID: 1
    }).toArray((err, result) => { // normal select method
        return callback(err, result);
    });
}
const getStoresByIds = (params, callback) => {
    db.get().collection(tableName).find(params, {
        _id: 1,
        coordinates: 1,
        storeAverageRating: 1,
        storeType: 1,
        storeTypeMsg: 1,
        storeCategory: 1,
        name: 1,
        cityId: 1,
        serviceZones: 1
    }).toArray((err, result) => { // normal select method
        return callback(err, result);
    });
}
/** 
 * @function
 * @name getStoreProductDataElastic 
 * @param {object} data - data coming from controller
 */
const getStoreProductDataElastic = (data, callback) => {
    //sfs
    elasticClient.get().msearch({
        index: indexName,
        type: tableName,
        body: [{
            "type": "stores"
        }, {
            "query": {
                "bool": {
                    "must": [{
                        "match_phrase_prefix": {
                            "name": data.name
                        }
                    }],
                    "should": [{
                        "match": {
                            "serviceZones": data.zoneId
                        }
                    }, {
                        "match": {
                            "businessZoneId": data.zoneId
                        }
                    }],
                    "minimum_should_match": 1,
                    "filter": {
                        "geo_distance": {
                            "distance": "100000km",
                            "location": {
                                "lat": data.lat,
                                "lon": data.long
                            }
                        }
                    }
                }
            },
            "sort": [{
                "_geo_distance": {
                    "location": {
                        "lat": data.lat,
                        "lon": data.long
                    },
                    "order": "asc",
                    "unit": "km",
                    "distance_type": "plane"
                }
            }],
            "_source": ["name", "businessAddress", "sort", "profileLogos", "_id", "freeDeliveryAbove"],
            "from": 0,
            "size": 30
        }, {
            "type": "childProducts"
        }, {
            "query": {
                "bool": {
                    "must": [{
                        "match_phrase_prefix": {
                            "productName": data.name
                        }
                    }]
                }
            },
            "_source": ["THC", "CBD", "productName", "price", "storeId", "thumbImage", "mobileImage", "parentProductId", "upc", "sku", "currency", "_id", "priceValue"],
            "from": 0,
            "size": 30
        }]
    }, (err, result) => {
        result.responses[0] = (result.responses[0].hits.total) ? result.responses[0].hits.hits : [];
        result.responses[1] = (result.responses[1].hits.total) ? result.responses[1].hits.hits : [];
        callback(err, result ? result.responses : []);
    });
}
/** 
 * @function
 * @name getDataElastic 
 * @param {object} data - data coming from controller
 */
const getDataElastic = (data, callback) => {
    elasticClient.get().search({
        index: indexName,
        type: tableName,
        body: {
            "query": {
                "bool": {
                    "must": [{
                        "match_phrase_prefix": {
                            "name": data.name
                        }
                    }],
                    "should": [{
                        "match": {
                            "serviceZones": data.zoneId
                        }
                    }, {
                        "match": {
                            "businessZoneId": data.zoneId
                        }
                    }],
                    "minimum_should_match": 1,
                    "filter": {
                        "geo_distance": {
                            "distance": "100000km",
                            "location": {
                                "lat": data.lat,
                                "lon": data.long
                            }
                        }
                    }
                }
            },
            "sort": [{
                "_geo_distance": {
                    "location": {
                        "lat": data.lat,
                        "lon": data.long
                    },
                    "order": "asc",
                    "unit": "km",
                    "distance_type": "plane"
                }
            }],
            "_source": ["name", "businessAddress", "sort", "profileLogos", "_id", "freeDeliveryAbove"]
        }
    }, (err, result) => {
        if (err) logger.error("err : ", err);
        result = (result.hits.total) ? result.hits.hits : [];
        callback(err, result);
    });
}
/** 
 * @function
 * @name getNearbyStoresId 
 * @param {object} params - data coming from controller
 */
const getNearbyStoresId = (params, callback) => {
    let cond = {};
    cond = (params.storeId == 0) ? {
        $and: [{
            catWiseProductCount: {
                $elemMatch: {
                    // firstCategoryId: new ObjectID(params.catId),
                    count: {
                        $gt: 0
                    }
                }
            },
            //    "catWiseProductCount": { $in: [params.catId] },
            status: 1,
            $or: [{
                "serviceZones": {
                    $in: [params.zoneId]
                }
            }]
        }]
    } : {
            $and: [{
                catWiseProductCount: {
                    $elemMatch: {
                        // firstCategoryId: new ObjectID(params.catId),
                        count: {
                            $gt: 0
                        }
                    }
                },
                status: 1,
                _id: new ObjectID(params.storeId),
                $or: [{
                    "serviceZones": {
                        $in: [params.zoneId]
                    }
                }]
            }]
        }
    let geoNearCond = [{
        $geoNear: {
            'near': {
                'longitude': parseFloat(params.long),
                'latitude': parseFloat(params.lat)
            },
            'distanceField': "distance",
            'distanceMultiplier': 6378.137,
            'spherical': true,
            'query': cond
            // 'query': { $and: [{ "firstCategory": { $in: [params.catId] }, status: 1 }, { "secondCategory": { $in: [params.subCatId.toString()] } }] }
        }
    }, {
        "$sort": {
            "distance": 1
        }
    }, {
        "$limit": 1
    }, {
        "$project": {
            name: 1,
            sName: 1,
            storeaddress: 1,
            storeBillingAddr: 1,
            storeAddr: 1,
            addressCompo: 1,
            streetName: 1,
            localityName: 1,
            areaName: 1,
            businessAddress: 1,
            coordinates: 1,
            profileLogos: 1,
            bannerImage: 1,
            bannerLogos: 1,
            businessZoneId: 1,
            freeDeliveryAbove: 1,
            minimumOrder: 1,
            averageRating: 1,
            subSubCatWiseProductCount: 1,
            storeSubCategory: 1,
            favorites: 1,
            costForTwo: 1,
            avgDeliveryTime: 1,
            currency: 1,
            currencySymbol: 1
        }
    }];
    db.get().collection(tableName).aggregate(geoNearCond, ((err, result) => {
        return callback(err, result ? result[0] : result);
    }));
}
/** 
 * @function
 * @name getNearby 
 * @param {object} params - data coming from controller
 */
// const getNearby = (params, callback) => {

//     let cond = {};
//     cond = (params.storeId == 0) ? {
//         $and: [{
//             catWiseProductCount: {
//                 $elemMatch: {
//                     firstCategoryId: {
//                         $exists: true
//                     },
//                     count: {
//                         $gt: 0
//                     }
//                 }
//             }
//         },
//         { status: 1 },
//         { storeType: parseInt(params.storeType) },
//         { "storeCategory.categoryId": params.storeCategoryId },
//         {
//             $or: [{
//                 "serviceZones": {
//                     $in: [params.zoneId]
//                 }

//             }]
//         }
//         ]

//     } : {
//             $and: [{
//                 status: 1,
//                 _id: new ObjectID(params.storeId)
//             }]
//         }
//     let geoNearCond = [{
//         $geoNear: {
//             'near': {
//                 'longitude': parseFloat(params.long),
//                 'latitude': parseFloat(params.lat)
//             },
//             'distanceField': "distance",
//             'distanceMultiplier': 6378.137,
//             'spherical': true,
//             'query': cond
//             // 'query': { $and: [{ "firstCategory": { $in: [params.catId] }, status: 1 }, { "secondCategory": { $in: [params.subCatId.toString()] } }] }
//         }
//     }, {
//         "$sort": {
//             "distance": 1
//         }
//     }, {
//         "$limit": 1
//     }, {
//         "$project": {
//             name: 1,
//             sName: 1,
//             storeaddress: 1,
//             storeAddr: 1,
//             addressCompo: 1,
//             streetName: 1,
//             localityName: 1,
//             areaName: 1,
//             storeBillingAddr: 1,
//             businessAddress: 1,
//             coordinates: 1,
//             profileLogos: 1,
//             bannerImage: 1,
//             bannerLogos: 1,
//             businessZoneId: 1,
//             freeDeliveryAbove: 1,
//             minimumOrder: 1,
//             storeType: 1,
//             cartsAllowed: 1,
//             cartsAllowedMsg: 1,
//             averageRating: 1,
//             storeTypeMsg: 1,
//             favorites: 1

//         }
//     }];
//     db.get().collection(tableName).aggregate(geoNearCond, ((err, result) => {

//         return callback(err, result ? result[0] : result);
//     }));
// }

const getNearby = (params, callback) => {
    logger.error(JSON.stringify(params))
    let cond = {};
    cond = (params.storeId == 0) ? {
        $and: [
            {
                catWiseProductCount: { $elemMatch: { firstCategoryId: { $exists: true }, count: { $gt: 0 } } },
                status: 1,
                $or: [
                    {
                        "serviceZones": { $in: [params.zoneId] }
                    }]
            }]
    } : {
            $and: [
                {
                    status: 1,
                    _id: new ObjectID(params.storeId)
                }]
        }


    let geoNearCond = [
        {
            $geoNear:
            {
                'near':
                {
                    'longitude': parseFloat(params.long),
                    'latitude': parseFloat(params.lat)
                },
                'distanceField': "distance",
                'distanceMultiplier': 6378.137,
                'spherical': true,
                'query': cond
                // 'query': { $and: [{ "firstCategory": { $in: [params.catId] }, status: 1 }, { "secondCategory": { $in: [params.subCatId.toString()] } }] }
            }
        },
        { "$sort": { "distance": 1 } },
        { "$limit": 1 },
        { "$project": { cartsAllowedMsg: 1, cartsAllowed: 1, name: 1, storedescription: 1, currencySymbol: 1, sName: 1, storeaddress: 1, storeAddr: 1, storeBillingAddr: 1, businessAddress: 1, coordinates: 1, profileLogos: 1, bannerImage: 1, bannerLogos: 1, businessZoneId: 1, freeDeliveryAbove: 1, minimumOrder: 1, storeType: 1, storeTypeMsg: 1, firstCategory: 1, secondCategory: 1, thirdCategory: 1, offer: 1, Symptoms: 1, brands: 1, favorites: 1 } }
    ];
    db.get().collection(tableName)
        .aggregate(geoNearCond, ((err, result) => {
            return callback(err, result ? result[0] : result);
        }));
}
const getNearbyLaundry = (params, callback) => {
    let cond = {};
    cond = {
        $and: [
            { status: 1 },
            { storeType: parseInt(params.storeType) },
            { "storeCategory.categoryId": params.storeCategoryId },
            {
                $or: [{
                    "serviceZones": {
                        $in: [params.zoneId]
                    }

                }]
            }
        ]

    }
    let geoNearCond = [{
        $geoNear: {
            'near': {
                'longitude': parseFloat(params.long),
                'latitude': parseFloat(params.lat)
            },
            'distanceField': "distance",
            'distanceMultiplier': 6378.137,
            'spherical': true,
            'query': cond

        }
    }, {
        "$sort": {
            "distance": 1
        }
    }, {
        "$limit": 1
    }, {
        "$project": {
            coordinates: 1,
        }
    }];
    db.get().collection(tableName).aggregate(geoNearCond, ((err, result) => {

        return callback(err, result ? result[0] : result);
    }));
}


const findMatch = (data, callback) => {
    elasticClient.get().search({
        index: indexName,
        type: tableName,
        body: {
            "query": {
                "bool": {
                    "must": [{
                        "match": {
                            "gender": data.gender
                        }
                    }, {
                        "range": {
                            "height": {
                                "gte": data.heightMin,
                                "lte": data.heightMax
                            }
                        }
                    }, {
                        "range": {
                            "dob": {
                                "gte": data.dobMin,
                                "lte": data.dobMax
                            }
                        }
                    }],
                    "must_not": [{
                        "match": {
                            "contactNumber": data.contactNumber
                        }
                    }],
                    "filter": {
                        "geo_distance": {
                            "distance": data.distanceMax,
                            "location": {
                                "lat": data.latitude,
                                "lon": data.longitude
                            }
                        }
                    }
                }
            },
            "sort": [{
                "_geo_distance": {
                    "location": {
                        "lat": data.latitude,
                        "lon": data.longitude
                    },
                    "order": "asc",
                    "unit": "km",
                    "distance_type": "plane"
                }
            }],
            "_source": ["firstName", "contactNumber", "gender", "registeredTimestamp", "profilePic", "otherImages", "email", "profileVideo", "dob", "about", "instaGramProfileId", "onlineStatus", "height", "location", "firebaseTopic"]
        }
    }, (err, result) => {
        callback(err, result);
    });
}
/** 
 * @function
 * @name getAllById 
 * @param {object} params - data coming from controller
 */
const getAllById = (params, callback) => {
    let query = (params.catId != 0) ? {
        $or: [{
            serviceZones: {
                $in: [params.id]
            },
            status: 1,
            catWiseProductCount: {
                $elemMatch: {
                    firstCategoryId: new ObjectID(params.catId),
                    count: {
                        $gt: 0
                    }
                }
            }
        }]
    } : {
            $or: [{
                serviceZones: {
                    $in: [params.id]
                },
                status: 1,
                catWiseProductCount: {
                    $elemMatch: {
                        firstCategoryId: {
                            $exists: true
                        },
                        count: {
                            $gt: 0
                        }
                    }
                }
            }]
        }
    var geoNearCond = [{
        $geoNear: {
            'near': {
                'longitude': parseFloat(params.long),
                'latitude': parseFloat(params.lat)
            },
            'distanceField': "distance",
            'distanceMultiplier': 6378.137,
            'spherical': true,
            'query': query
        }
    }, {
        "$sort": {
            "distance": 1
        }
    },
    // { "$limit": 1 },
    {
        "$project": {
            name: 1,
            sName: 1,
            storeaddress: 1,
            storeBillingAddr: 1,
            storeAddr: 1,
            addressCompo: 1,
            streetName: 1,
            localityName: 1,
            areaName: 1,
            storedescription: 1,
            coordinates: 1,
            images: 1,
            businessPhone: 1,
            businessEmail: 1,
            businessAddress: 1,
            storeImageUrl: 1,
            distance: 1,
            freeDeliveryAbove: 1,
            minimumOrder: 1,
            logoImage: 1,
            profileLogos: 1,
            bannerImage: 1,
            bannerLogos: 1,
            averageRating: 1,
            storeType: 1,
            cartsAllowed: 1,
            cartsAllowedMsg: 1,
            storeTypeMsg: 1,
            costForTwo: 1
        }
    }
    ];
    db.get().collection(tableName).aggregate(geoNearCond, ((err, result) => {
        return callback(err, result);
    }));
}
/** 
 * @function
 * @name getRecentlyAdded 
 * @param {object} params - data coming from controller
 */
const getRecentlyAdded = (params, callback) => {
    db.get().collection("popularItem").aggregate(params
    ).toArray((err, result) => { // normal select method
        return callback(err, result);
    });
}
/** 
 * @function
 * @name getSubCategories 
 * @param {object} params - data coming from controller
 */
const getSubCategories = (params, callback) => {
    db.get().collection(tableName).aggregate([{
        $match: {
            "_id": params.businessId
        }
    }, {
        $lookup: {
            "from": "secondCategory",
            "localField": "firstCategory",
            "foreignField": "categoryId",
            "as": "categories"
        }
    }, {
        $unwind: "$categories"
    }, {
        $project: {
            subCategoryName: "$categories.name",
            subCategoryId: "$categories._id",
            categoryId: "$categories.categoryId"
        }
    },
        //  { $lookup: { "from": "childProducts", "localField": "_id", "foreignField": "storeId", "as": "products" } }, 
    ]).toArray((err, result) => { // normal select method
        return callback(err, result);
    });
}
/** 
 * @function
 * @name isExistsWithId 
 * @param {object} condition - data coming from controller
 */
const isExistsWithId = (condition, callback) => {

    db.get().collection(tableName).findOne(condition, (err, result) => {
        return callback(err, result);
    });
}
/** 
 * @function
 * @name isExist 
 * @param {object} params - data coming from controller
 */
const isExistWithZone = (params, callback) => {
    db.get().collection(tableName).findOne({
        _id: new ObjectID(params.id),
        serviceZones: {
            $in: [params.zoneId]
        }
    }, {
        name: 1,
        coordinates: 1,
        freeDeliveryAbove: 1,
        businessAddress: 1,
        profileLogos: 1,
        bannerImage: 1,
        bannerLogos: 1,
        forcedAccept: 1,
        driverType: 1,
        pricePerMile: 1,
        orderType: 1,
        businessRating: 1
    }, (err, result) => {
        return callback(err, result);
    });
};
/** 
 * @function
 * @name patchRating 
 * @param {object} params - data coming from controller
 */
const patchRating = (params, callback) => {
    db.get().collection(tableName).findOneAndUpdate({
        _id: params._id
    }, {
        $set: {
            averageRating: parseFloat(params.finalAverageValue),
            orderCount: params.orderCount
        },
        $push: {
            reviewLogs: params.reviewLog
        }
    }, (err, result) => {
        return callback(err, result);
    });
}
/** 
 * @function
 * @name getAllByCategoryId 
 * @param {object} params - data coming from controller
 */
// const getAllByCategoryId = (params, callback) => {
//     db.get({}).collection(tableName).find({
//         storeType: params.type,
//         status: 1,
//         catWiseProductCount: {
//             $elemMatch: {
//                 firstCategoryId: {
//                     $exists: true
//                 },
//                 count: {
//                     $gt: 0
//                 }
//             }
//         },
//         businessZoneId: params.businessZoneId
//     }).sort({
//         _id: -1
//     }).toArray((err, result) => {
//         return callback(err, result);
//     });
// }
// const getAllByCategoryId = (params, callback) => {
//     let query = {
//         $or: [{
//             storeType: params.type,
//             status: 1,
//             catWiseProductCount: {
//                 $elemMatch: {
//                     firstCategoryId: {
//                         $exists: true
//                     },
//                     count: {
//                         $gt: 0
//                     }
//                 }
//             },
//             // businessZoneId: params.zoneId
//         }]
//     }
//     var geoNearCond = [{
//             $geoNear: {
//                 'near': {
//                     'longitude': parseFloat(params.long),
//                     'latitude': parseFloat(params.lat)
//                 },
//                 'distanceField': "distance",
//                 'distanceMultiplier': 6378.137,
//                 'spherical': true,
//                 'query': query
//             }
//         }, {
//             "$sort": {
//                 "distance": 1
//             }
//         },
//         // { "$limit": 1 },
//         {
//             "$project": {
//                 name: 1,
//                 sName: 1,
//                 storeaddress: 1,
//                 storeBillingAddr: 1,
//                 storeAddr: 1,
//                 storedescription: 1,
//                 coordinates: 1,
//                 images: 1,
//                 businessPhone: 1,
//                 businessEmail: 1,
//                 businessAddress: 1,
//                 storeImageUrl: 1,
//                 distance: 1,
//                 freeDeliveryAbove: 1,
//                 minimumOrder: 1,
//                 logoImage: 1,
//                 profileLogos: 1,
//                 bannerImage: 1,
//                 bannerLogos: 1,
//                 averageRating: 1,
//                 storeType: 1,
// cartsAllowed: 1,
// cartsAllowedMsg: 1,
//                 storeTypeMsg: 1,
//                 franchiseId: 1,
//                 franchiseName: 1,
//                 businessZoneId: 1,
//                 foodType: item.foodType ? item.foodType : 0,
//                 foodTypeName: 1,
//                 costForTwo: 1,
// avgDeliveryTime: 1,
//                 averageRating: 1
//             }
//         }
//     ];
//     db.get().collection(tableName).aggregate(geoNearCond, ((err, result) => {
//         return callback(err, result);
//     }));
// }
const getAllByCategoryId = (params, callback) => {
    let query = {
        $or: [{
            "storeType": params.type,
            "status": 1,
            "storeCategory.categoryId": params.categoryId,
            "catWiseProductCount": {
                $elemMatch: {
                    firstCategoryId: {
                        $exists: true
                    },
                    count: {
                        $gt: 0
                    }
                }
            },
            "serviceZones": {
                $in: [params.zoneId]
            }
        }]
    }
    var geoNearCond = [{
        $geoNear: {
            'near': {
                'longitude': parseFloat(params.long),
                'latitude': parseFloat(params.lat)
            },
            'distanceField': "distance",
            'distanceMultiplier': 6378.137,
            'spherical': true,
            'query': query
        }
    }, {
        "$sort": {
            "distance": 1
        }
    },

    {
        "$project": {
            name: 1,
            sName: 1,
            storeaddress: 1,
            storeBillingAddr: 1,
            storeAddr: 1,
            addressCompo: 1,
            streetName: 1,
            localityName: 1,
            areaName: 1,
            storedescription: 1,
            coordinates: 1,
            images: 1,
            businessPhone: 1,
            businessEmail: 1,
            businessAddress: 1,
            storeImageUrl: 1,
            distance: 1,
            freeDeliveryAbove: 1,
            minimumOrder: 1,
            logoImage: 1,
            profileLogos: 1,
            bannerImage: 1,
            bannerLogos: 1,
            averageRating: 1,
            storeType: 1,
            storeTypeMsg: 1,
            cartsAllowed: 1,
            cartsAllowedMsg: 1,
            franchiseId: 1,
            franchiseName: 1,
            costForTwo: 1,
            avgDeliveryTime: 1,
            foodType: 1,
            foodTypeName: 1,
            storeSubCategory: 1,
            storeCategory: 1,

        }
    }
    ];
    db.get().collection(tableName).aggregate(geoNearCond).skip(params.offset).limit(params.limit).toArray((err, result) => {

        return callback(err, result);
    });
}

// Get stores by category id 

const getStoresByCategoryId = (params, callback) => {
    let query = {
        $or: [{
            "storeType": params.type,
            "status": 1,
            "storeCategory.categoryId": params.categoryId,
            "catWiseProductCount": {
                $elemMatch: {
                    firstCategoryId: {
                        $exists: true
                    },
                    count: {
                        $gt: 0
                    }
                }
            },
            "serviceZones": {
                $in: [params.zoneId]
            }
        }]
    }
    // var geoNearCond = [{
    //     $geoNear: {
    //         'near': {
    //             'longitude': parseFloat(params.long),
    //             'latitude': parseFloat(params.lat)
    //         },
    //         'distanceField': "distance",
    //         'distanceMultiplier': 6378.137,
    //         'spherical': true,
    //         'query': query
    //     }
    // }, {
    //     "$sort": {
    //         "distance": 1
    //     }
    // },

    // {
    //     "$project": {
    //         name: 1,
    //         sName: 1,
    //         storeaddress: 1,
    //         storeBillingAddr: 1,
    //         storeAddr: 1,
    //         addressCompo: 1,
    //         streetName: 1,
    //         localityName: 1,
    //         areaName: 1,
    //         storedescription: 1,
    //         coordinates: 1,
    //         images: 1,
    //         businessPhone: 1,
    //         businessEmail: 1,
    //         businessAddress: 1,
    //         storeImageUrl: 1,
    //         distance: 1,
    //         freeDeliveryAbove: 1,
    //         minimumOrder: 1,
    //         logoImage: 1,
    //         profileLogos: 1,
    //         bannerImage: 1,
    //         bannerLogos: 1,
    //         averageRating: 1,
    //         storeType: 1,
    //         storeTypeMsg: 1,
    //         cartsAllowed: 1,
    //         cartsAllowedMsg: 1,
    //         franchiseId: 1,
    //         franchiseName: 1,
    //         costForTwo: 1,
    //         avgDeliveryTime: 1,
    //         foodType: 1,
    //         foodTypeName: 1,
    //         storeSubCategory: 1,
    //         storeCategory: 1,

    //     }
    // }
    // ];
    db.get().collection(tableName).find(geoNearCond).skip(params.offset).limit(params.limit).toArray((err, result) => {

        return callback(err, result);
    });
}



const getAllByCategoryFavourite = (params, callback) => {
    let query = {
        $or: [{
            "storeType": params.type,
            "status": 1,
            "storeCategory.categoryId": params.categoryId,
            "catWiseProductCount": {
                $elemMatch: {
                    firstCategoryId: {
                        $exists: true
                    },
                    count: {
                        $gt: 0
                    }
                }
            },
            "serviceZones": {
                $in: [params.zoneId]
            }
        }]
    }
    var geoNearCond = [{
        $geoNear: {
            'near': {
                'longitude': parseFloat(params.long),
                'latitude': parseFloat(params.lat)
            },
            'distanceField': "distance",
            'distanceMultiplier': 6378.137,
            'spherical': true,
            'query': query
        }
    }, {
        "$sort": {
            "distance": 1
        }
    },

    {
        "$project": {
            name: 1,
            sName: 1,
            storeaddress: 1,
            storeBillingAddr: 1,
            storeAddr: 1,
            addressCompo: 1,
            streetName: 1,
            localityName: 1,
            areaName: 1,
            storedescription: 1,
            coordinates: 1,
            images: 1,
            businessPhone: 1,
            businessEmail: 1,
            businessAddress: 1,
            storeImageUrl: 1,
            distance: 1,
            freeDeliveryAbove: 1,
            minimumOrder: 1,
            logoImage: 1,
            profileLogos: 1,
            bannerImage: 1,
            bannerLogos: 1,
            averageRating: 1,
            storeType: 1,
            cartsAllowed: 1,
            cartsAllowedMsg: 1,
            storeTypeMsg: 1,
            franchiseId: 1,
            franchiseName: 1,
            costForTwo: 1,
            avgDeliveryTime: 1,
            foodType: 1,
            foodTypeName: 1,
            storeSubCategory: 1,
            storeCategory: 1,

        }
    }
    ];
    db.get().collection(tableName).aggregate(geoNearCond).toArray((err, result) => {

        return callback(err, result);
    });
}
const getAllBySubCategoryCount = (params, callback) => {
    let query = {
        $or: [{
            "storeType": params.type,
            "status": 1,
            "storeCategory.categoryId": params.categoryId,
            "storeSubCategory.subCategoryId": params.subcategoryId,
            "catWiseProductCount": {
                $elemMatch: {
                    firstCategoryId: {
                        $exists: true
                    },
                    count: {
                        $gt: 0
                    }
                }
            },
            // "subCatWiseProductCount": {
            //     $elemMatch: {
            //         firstCategoryId: {
            //             $exists: true
            //         },
            //         secondCategoryId: {
            //             $exists: true
            //         },
            //         count: {
            //             $gt: 0
            //         }
            //     }
            // },
            "serviceZones": {
                $in: [params.zoneId]
            }
        }]
    }

    db.get().collection(tableName).count(query, function (err, count) {
        return callback(err, count);
    });

}
const getAllBySubCategoryId = (params, callback) => {
    let query = {
        $or: [{
            "storeType": params.type,
            "status": 1,
            "storeCategory.categoryId": params.categoryId,
            "storeSubCategory.subCategoryId": params.subcategoryId,
            "catWiseProductCount": {
                $elemMatch: {
                    firstCategoryId: {
                        $exists: true
                    },
                    count: {
                        $gt: 0
                    }
                }
            },
            // "subCatWiseProductCount": {
            //     $elemMatch: {
            //         firstCategoryId: {
            //             $exists: true
            //         },
            //         secondCategoryId: {
            //             $exists: true
            //         },
            //         count: {
            //             $gt: 0
            //         }
            //     }
            // },
            "serviceZones": {
                $in: [params.zoneId]
            }
        }]
    }
    var geoNearCond = [{
        $geoNear: {
            'near': {
                'longitude': parseFloat(params.long),
                'latitude': parseFloat(params.lat)
            },
            'distanceField': "distance",
            'distanceMultiplier': 6378.137,
            'spherical': true,
            'query': query
        }
    }, {
        "$sort": {
            "distance": 1
        }
    },

    {
        "$project": {
            name: 1,
            sName: 1,
            storeaddress: 1,
            storeBillingAddr: 1,
            storeAddr: 1,
            addressCompo: 1,
            streetName: 1,
            localityName: 1,
            areaName: 1,
            storedescription: 1,
            coordinates: 1,
            images: 1,
            businessPhone: 1,
            businessEmail: 1,
            businessAddress: 1,
            storeImageUrl: 1,
            distance: 1,
            freeDeliveryAbove: 1,
            minimumOrder: 1,
            logoImage: 1,
            profileLogos: 1,
            bannerImage: 1,
            bannerLogos: 1,
            averageRating: 1,
            storeType: 1,
            cartsAllowed: 1,
            cartsAllowedMsg: 1,
            storeTypeMsg: 1,
            franchiseId: 1,
            franchiseName: 1,
            costForTwo: 1,
            avgDeliveryTime: 1,
            foodType: 1,
            foodTypeName: 1,
            storeSubCategory: 1,
            storeCategory: 1,
            currencySymbol: 1
        }
    }
    ];
    db.get().collection(tableName).aggregate(geoNearCond).skip(params.offset).limit(params.limit).toArray((err, result) => {

        return callback(err, result);
    });
}

/** 
 * @function
 * @name pushFavorites 
 * @param {object} params - data coming from controller
 */
const pushFavorites = (params, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate(
            { _id: new ObjectID(params.storeId) },
            {
                $addToSet: {
                    favorites: {
                        userId: params.userId,
                        zoneId: params.zoneId,
                        createdBy: params.createdBy, timeStamp: moment().unix(), isoDate: new Date()
                    },
                    favoritesHistory: {
                        userId: params.userId,
                        zoneId: params.zoneId,
                        createdBy: params.createdBy, timeStamp: moment().unix(), isoDate: new Date()
                    }
                },
                $inc: {
                    favoriteCount: 1
                }
            },
            { returnOriginal: false },
            (err, result) => { return callback(err, result); });
}



/** 
 * @function
 * @name pullFavorites 
 * @param {object} params - data coming from controller
 */
const pullFavorites = (params, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate(
            { _id: new ObjectID(params.storeId) },
            {
                $pull: {
                    favorites: {
                        userId: params.userId,
                    }
                }
            },
            { returnOriginal: false },
            (err, result) => { return callback(err, result); });
}


const insert = (params, callback) => {
    db.get().collection(tableName).insert(params, (err, result) => {
        return callback(err, result);
    })
}
const update = (params, callback) => {
    db.get().collection(tableName).update(params.q, params.data, (err, result) => {
        return callback(err, result)
    })
}

const get = (params, callback) => {
    db.get({}).collection(tableName).find({}).sort({
        _id: -1
    }).toArray((err, result) => {
        return callback(err, result[0]);
    });
}
const readAll = (condition, callback) => {
    db.get().collection(tableName).find(condition).toArray((err, result) => {
        return callback(err, result);
    });
}
const getOne = (params, callback) => {
    db.get().collection(tableName).findOne(params, (err, result) => {
        return callback(err, result);
    })
}
const deleteItem = (params, callback) => {
    db.get().collection(tableName).remove(params, (err, result) => {
        return callback(err, result);
    })
}
const updateS = (query, params, callback) => {
    db.get().collection(tableName).update(query, params, (err, result) => {
        return callback(err, result);
    });
}
const updateMany = (queryObj, callback) => {
    // db.get().collection(tableName).findOneAndUpdate({
    db.get().collection(tableName).updateMany(queryObj.query, queryObj.data, {
        returnOriginal: false
    }, (err, result) => {
        return callback(err, result);
    });
}
const isExistsCountrycode = (params, callback) => {
    db.get().collection(tableName)
        .findOne({
            $or: [
                { ownerEmail: params.email },
                { countryCode: params.countryCode, ownerPhone: params.phone }
            ]
        }, (err, result) => {
            return callback(err, result);
        });
}

const setPassword = (params, callback) => {

    db.get().collection(tableName)
        .findOneAndUpdate({ _id: params._id },
            { $set: { password: params.password } }, {},
            (err, result) => { return callback(err, result); });
}

const SelectOne = (data, callback) => {
    db.get().collection(tableName)
        .findOne(data, ((err, result) => {
            return callback(err, result);
        }));
}

const fineAndUpdate = (condition, data, callback) => {
    db.get().collection(tableName).update(condition, { $set: data }, (function (err, result) {
        return callback(err, result);
    }));
}

// const findOneAndUpdate = (queryObj, cb) => {
//     db.get().collection(tableName)
//         .findOneAndUpdate(queryObj.query, queryObj.data, queryObj.options || {}, (err, result) => {
//             return cb(err, result);
//         });
// };
const findOneAndUpdate = (params, callback) => {
    db.get().collection(tableName).findOneAndUpdate(params.q, params.data, {
        returnOriginal: false
    }, (err, result) => {
        return callback(err, result)
    })
}
/** 
 * @function
 * @name isExistsWithCond 
 * @param {object} params - data coming from controller
 */
const isExistsWithCond = (params, callback) => {
    db.get().collection(tableName)
        .findOne(params, { status: 1 }, (err, result) => {
            return callback(err, result);
        });
}
const getAllByLocation = (params, callback) => {
    let query = {
        $or: [{
            "storeType": params.type,
            "status": 1,
            "serviceZones": {
                $in: [params.zoneId.toString()]
            }
        }]
    }
    var geoNearCond = [
        {
            $geoNear: {
                'near': {
                    'longitude': parseFloat(params.long),
                    'latitude': parseFloat(params.lat)
                },
                'distanceField': "distance",
                'distanceMultiplier': 6378.137,
                'spherical': true,
                'query': query
            }
        }, {
            "$sort": {
                "distance": 1
            }
        },
        {
            "$project": {
                name: 1,
                sName: 1,
                storeaddress: 1,
                storeBillingAddr: 1,
                storeAddr: 1,
                addressCompo: 1,
                storedescription: 1,
                coordinates: 1,
                images: 1,
                businessPhone: 1,
                businessEmail: 1,
                businessAddress: 1,
                storeImageUrl: 1,
                distance: 1,
                freeDeliveryAbove: 1,
                minimumOrder: 1,
                logoImage: 1,
                profileLogos: 1,
                bannerImage: 1,
                bannerLogos: 1,
                averageRating: 1,
                storeType: 1,
                storeTypeMsg: 1,
                franchiseId: 1,
                franchiseName: 1,
                costForTwo: 1,
                foodType: 1,
                foodTypeName: 1,
                storeSubCategory: 1,
                storeCategory: 1,

            }
        }
    ];
    db.get().collection(tableName)
        .aggregate(geoNearCond).skip(params.offset).limit(params.limit).toArray((err, result) => {
            return callback(err, result);
        });
}

const updateWithPush = (query, params, callback) => {
    db.get().collection(tableName)
        .update(query, params, (err, result) => {
            return callback(err, result);
        });
}
const getStores = (params, callback) => {
    let cond = {
        catWiseProductCount: {
            $elemMatch: {
                // firstCategoryId: new ObjectID(params.catId),
                count: {
                    $gt: 0
                }
            }
        },
        status: 1,
        _id: new ObjectID(params.storeId),
    }
    db.get().collection(tableName).findOne(cond, ((err, result) => {

        return callback(err, result);
    }));
}
const getAllByStoreType = (params, callback) => {
    let query = {
        $or: [{
            "storeType": params.storeType,
            "status": 1,
            "catWiseProductCount": {
                $elemMatch: {
                    firstCategoryId: {
                        $exists: true
                    },
                    count: {
                        $gt: 0
                    }
                }
            },
            "cityId": params.cityId

        }]
    }
    db.get().collection(tableName).find(query).toArray((err, result) => {
        return callback(err, result);
    });
}

module.exports = {
    getStores,
    updateWithPush,
    getOneElastic,
    isExistsWithCond,
    SelectOne,
    fineAndUpdate,
    isExistsCountrycode,
    setPassword,
    updateMany,
    getById,
    getAllStoresById,
    getAllById,
    getStoreProductDataElastic,
    getDataElastic,
    findMatch,
    getNearbyStoresId,
    getNearby,
    getNearbyLaundry,
    getRecentlyAdded,
    getZonalCategoriesById,
    getStoreCategoriesById,
    isExist,
    create,
    getSubCategories,
    isExistsWithId,
    isExistWithZone,
    patchRating,
    getZonalSubSubCatById,
    getAllByCategoryFavourite,
    getAllBySubCategoryCount,
    getAllByCategoryId,
    getAllBySubCategoryId,
    updateS,
    insert,
    readAll,
    update,
    get,
    getOne,
    deleteItem,
    findOneAndUpdate,
    pullFavorites,
    pushFavorites,
    getAllByLocation,
    getNearbyLaundry,
    getStoresByIds,
    getStoresByCategoryId,
    getAllByStoreType
}