'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'franchiseProducts'
const ObjectID = require('mongodb').ObjectID;
const logger = require('winston');
const elasticClient = require('../elasticSearch');
const indexName = process.env.ElasticProductIndex;
/** 
 * @function
 * @name getProductDetails 
 * @param {object} params - data coming from controller
 */
const getProductDetails = (params, callback) => {
    db.get().collection(tableName)
        .findOne({
            _id: params._id,
            status: { '$in': [1, 6] }
        }, {
                productName: 1,
                productname: 1,
                strainEffects: 1,
                nutritionFactsInfo: 1,
                priceValue: 1,
                shortDescription: 1,
                sDescription: 1,
                detailDescription: 1,
                detailedDescription: 1,
                THC: 1,
                CBD: 1,
                thumbImage: 1,
                franchiseId: 1,
                images: 1,
                mobileImage: 1,
                secondCategoryName: 1,
                favorites: 1,
                units: 1,
                wishList: 1,
                offer: 1,
                taxes: 1,
                parentProductId: 1,
                sku: 1,
                upcName: 1,
                ingredients: 1,
                catName: 1,
                subCatName: 1,
                subSubCatName: 1,
                addOns: 1
            }, (err, result) => {
                return callback(err, result);
            });
}
/** 
 * @function
 * @name getProductsSubCatwise 
 * @param {object} params - data coming from controller
 */
const getProductsSubCatwise = (params, callback) => {
    var condition = {
        firstCategoryId: params.firstCategoryId,
        franchiseId: params.franchiseId,
        status: { '$in': [1, 6] }
    };
    if (params.productName != '' && typeof params.productName != 'undefined') {
        condition.productName = params.productName;
    }
    if (params.secondCategoryId != '' && typeof params.secondCategoryId != 'undefined') {
        condition.secondCategoryId = params.secondCategoryId;
    }
    if (params.subSubCategoryId != '' && typeof params.subSubCategoryId != 'undefined') {
        condition.subSubCategoryId = params.subSubCategoryId;
    }

    db.get().collection(tableName)
        .find(condition, {
            THC: 1,
            CBD: 1,
            productName: 1,
            productname: 1,
            units: 1,
            price: 1,
            franchiseId: 1,
            addOns: 1,
            images: 1,
            parentProductId: 1,
            upc: 1,
            sku: 1,
            currency: 1,
            priceValue: 1,
            offer: 1,
            brand: 1,
            addOns: 1,
        }).skip(params.skip).limit(params.limit)
        .toArray((err, result) => { // normal select method
            return callback(err, result);
        });
}

/** 
 * @function
 * @name getProductsSubCatwise 
 * @param {object} params - data coming from controller
 */
const getProductsSubCatwiseProduct = (params, skip, limit, callback) => {
    db.get().collection(tableName)
        .find(params, {
            THC: 1,
            CBD: 1,
            productName: 1,
            productname: 1,
            units: 1,
            price: 1,
            franchiseId: 1,
            images: 1,
            parentProductId: 1,
            upc: 1,
            sku: 1,
            currency: 1,
            priceValue: 1,
            offer: 1,
            brand: 1,
            addOns: 1,
            categoryName: 1,
            firstCategoryId: 1,
            firstCategoryName: 1,
            secondCategoryId: 1,
            subCatName: 1,
            secondCategoryName: 1,
            thirdCategoryId: 1,
            thirdCategoryName: 1,
            catName: 1,
            consumptionTime: 1
        }).skip(skip).limit(limit)
        .toArray((err, result) => { // normal select method
            return callback(err, result);
        });
}

/** 
 * @function
 * @name getDataElastic 
 * @param {object} data - data coming from controller
 */
function getDataElastic(data, callback) {
    elasticClient.get().search({
        index: indexName,
        type: tableName,
        body: {
            "query": {
                "bool": {
                    "must": [{
                        "match_phrase_prefix": {
                            "productName": data.name
                        }
                    }]
                }
            },
            "_source": ["THC", "CBD", "productName", "price", "franchiseId", "thumbImage", "mobileImage", "parentProductId", "upc", "sku", "currency", "_id",
                "priceValue"
            ]
        }
    }, (err, result) => {
        result = (result.hits.total) ? result.hits.hits : [];
        callback(err, result);
    });
}
// /** 
// * @function
// * @name getDataElastic 
// * @param {object} data - data coming from controller
// */
// function getElasticData(data, callback) {
//     elasticClient.get().search({
//         index: indexName,
//         type: tableName,
//         body:
//             {
//                 "query": { "bool": { "must": [{ "match_phrase_prefix": { "franchiseId": data.franchiseId } }, { "match_phrase_prefix": { "productName": data.name } }] } },
//                 "_source": ["THC", "CBD", "productName", "price", "franchiseId", "thumbImage", "mobileImage", "parentProductId", "upc", "sku", "currency", "_id",
//                     "priceValue"]
//             }
//     }, (err, result) => {
//         result = (result.hits.total) ? result.hits.hits : [];
//         callback(err, result);
//     });
// }
/** 
 * @function
 * @name getDataElastic 
 * @param {object} data - data coming from controller
 */
function getElasticData(data, callback) {
    elasticClient.get().search({
        index: indexName,
        type: tableName,
        body: {
            "query": {
                "bool": {
                    "must": data
                }
            },
            "_source": ["THC", "CBD", "productName", "price", "franchiseId", "thumbImage", "mobileImage", "parentProductId", "upc", "sku", "currency", "_id",
                "priceValue"
            ]
        }
    }, (err, result) => {
        result = (result.hits.total) ? result.hits.hits : [];
        callback(err, result);
    });
}
// /** 
// * @function
// * @name getRecentlyAdded 
// * @param {object} params - data coming from controller
// */
// const getRecentlyAdded = (params, callback) => {

//     db.get().collection(tableName)
//         .aggregate([
//             { $match: { "favorites.userId": { $in: ["5a3362f8477765879bb07cf8"] } } },
//             { $lookup: { "from": "stores", "localField": "franchiseId", "foreignField": "_id", "as": "stores" } },
//             { $unwind: "$stores" },
//             {
//                 $project: {
//                     THC: 1, CBD: 1, productName: 1, price: 1, franchiseId: 1, thumbImage: 1, mobileImage: 1, parentProductId: 1, upc: 1, sku: 1, currency: 1,
//                     priceValue: 1, storeName: "$stores.name", storeAddress: "$stores.businessAddress", storeLogo: "$stores.images", storeCoordinates: "$stores.coordinates"
//                 }
//             }
//         ])
//         .toArray((err, result) => { // normal select method
//             return callback(err, result);
//         });
// }
/** 
 * @function
 * @name pullFavorites 
 * @param {object} params - data coming from controller
 */
const pullFavorites = (params, callback) => {
    db.get().collection(tableName)
        .update({
            _id: new ObjectID(params.childProductId)
        }, {
                $pull: {
                    favorites: {
                        userId: params.userId,
                        // unitId: params.unitId 
                    }
                }
            },
            (err, result) => {
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
        .update({
            _id: new ObjectID(params.childProductId)
        }, {
                $push: {
                    favorites: {
                        userId: params.userId,
                        //unitId: params.unitId,
                        createdBy: params.createdBy,
                        timeStamp: moment().unix(),
                        isoDate: new Date()
                    },
                    favoritesHistory: {
                        userId: params.userId,
                        //unitId: params.unitId,
                        createdBy: params.createdBy,
                        timeStamp: moment().unix(),
                        isoDate: new Date()
                    }
                },
                $inc: {
                    favoriteCount: 1
                }
            },
            (err, result) => {
                return callback(err, result);
            });
}
/** 
 * @function
 * @name patchViews 
 * @param {object} params - data coming from controller
 */
const patchViews = (params, callback) => {
    db.get().collection(tableName)
        .update({
            _id: new ObjectID(params.childProductId)
        }, {
                $push: {
                    views: {
                        userId: params.userId,
                        createdBy: params.createdBy,
                        timeStamp: moment().unix()
                    }
                },
                $inc: {
                    viewCount: 1
                }

            },
            (err, result) => {
                return callback(err, result);
            });
}
// /** 
//  * @function
//  * @name patchViews 
//  * @param {object} params - data coming from controller
//  */
// const patchViews = (params, callback) => {
//     db.get().collection(tableName)
//         .update(
//         { _id: new ObjectID(params.childProductId) ,"views.userId":params.userId},
//         {
//           $inc : { "views.$.count" :1 }, 

//         },
//          (err, result) => { 
//             return callback(err, result); });
// }

/** 
 * @function
 * @name getFavorite 
 * @param {object} params - data coming from controller
 */
const getFavorite = (params, callback) => {
    if (params.franchiseId == 0) {
        db.get().collection(tableName)
            .aggregate([{
                $match: {
                    "favorites.userId": {
                        $in: [params.userId]
                    },
                    // "zoneId":params.zoneId,
                    status: { '$in': [1, 6] }
                }
            }, {
                $lookup: {
                    "from": "stores",
                    "localField": "franchiseId",
                    "foreignField": "_id",
                    "as": "stores"
                }
            }, {
                $unwind: "$stores"
            },
            {
                $match: {
                    "stores.serviceZones": { $in: [params.zoneId] }
                }
            },
            {
                $project: {
                    units: 1,
                    profileLogos: "$stores.profileLogos",
                    bannerImage: "$stores.bannerLogos",
                    THC: 1,
                    CBD: 1,
                    productName: 1,
                    productname: 1,
                    price: 1,
                    franchiseId: 1,
                    images: 1,
                    parentProductId: 1,
                    upc: 1,
                    sku: 1,
                    currency: 1,
                    priceValue: 1,
                    storeName: "$stores.sName",
                    storeAddress: "$stores.storeAddr",
                    storeLogo: "$stores.images",
                    storeCoordinates: "$stores.coordinates"
                }
            }, {
                $limit: 10
            }])
            .toArray((err, result) => { // normal select method
                return callback(err, result);
            });
    } else {
        db.get().collection(tableName)
            .aggregate([{
                $match: {
                    "favorites.userId": {
                        $in: [params.userId]
                    },
                    //  "zoneId":params.zoneId,
                    status: { '$in': [1, 6] }
                }
            }, {
                $lookup: {
                    "from": "stores",
                    "localField": "franchiseId",
                    "foreignField": "_id",
                    "as": "stores"
                }
            },
            {
                $unwind: "$stores"
            },
            {
                $match: {
                    "stores._id": (params.franchiseId != 0) ? new ObjectID(params.franchiseId) : "",
                    "stores.serviceZones": { $in: [params.zoneId] }
                }
            }
                , {
                $project: {
                    units: 1,
                    profileLogos: "$stores.profileLogos",
                    bannerImage: "$stores.bannerLogos",
                    THC: 1,
                    CBD: 1,
                    productName: 1,
                    productname: 1,
                    price: 1,
                    franchiseId: 1,
                    images: 1,
                    parentProductId: 1,
                    upc: 1,
                    sku: 1,
                    currency: 1,
                    priceValue: 1,
                    storeName: "$stores.sName",
                    storeAddress: "$stores.storeAddr",
                    storeLogo: "$stores.images",
                    storeCoordinates: "$stores.coordinates"
                }
            }, {
                $limit: 10
            }])
            .toArray((err, result) => { // normal select method
                return callback(err, result);
            });
    }

}
/** 
 * @function
 * @name getFavoriteHome 
 * @param {object} params - data coming from controller
 */
const getFavoriteHome = (params, callback) => {
    if (params.type == 0) { // favorites
        db.get().collection(tableName)
            .aggregate([{
                $match: {
                    "favorites.userId": {
                        $in: [params.userId]
                    },
                    status: { '$in': [1, 6] }
                }
            }, {
                $lookup: {
                    "from": "stores",
                    "localField": "franchiseId",
                    "foreignField": "_id",
                    "as": "stores"
                }
            }, {
                $unwind: "$stores"
            }, {
                $match: {
                    "stores._id": params.franchiseId
                }
            }, {
                $project: {
                    units: 1,
                    profileLogos: "$stores.profileLogos",
                    bannerImage: "$stores.bannerLogos",
                    THC: 1,
                    CBD: 1,
                    productName: 1,
                    productname: 1,
                    offer: 1,
                    price: 1,
                    franchiseId: 1,
                    images: 1,
                    parentProductId: 1,
                    upc: 1,
                    sku: 1,
                    currency: 1,
                    priceValue: 1,
                    storeName: "$stores.sName",
                    storeAddress: "$stores.storeAddr",
                    storeLogo: "$stores.images",
                    storeCoordinates: "$stores.coordinates"
                }
            }, {
                $skip: params.skip || 0
            }, {
                $limit: params.limit // 5
            },])
            .toArray((err, result) => { // normal select method
                return callback(err, result);
            });
    }
    if (params.type == 1) { // trending
        // db.get().collection("PythonPopularItem")
        // .aggregate([
        //     { $sort: { "timestamp": -1 } },
        //     { $limit: 1 },
        //     { $unwind: "$zonewiseProducts" },
        //     { $match: { "zonewiseProducts.zoneId": params.zoneId } },
        //     { $unwind: "$zonewiseProducts.products" },
        //     { $match: { "zonewiseProducts.products.franchiseId": params.franchiseId } }
        //     ,
        //     {
        //         $project: {
        //             productName: "$zonewiseProducts.products.productname",
        //             productname: "$zonewiseProducts.products.productname",
        //             childProductId: "$zonewiseProducts.products.childProductId",
        //             _id: "$zonewiseProducts.products.childProductId",
        //             franchiseId: "$zonewiseProducts.products.franchiseId",
        //             THC: "$zonewiseProducts.products.THC",
        //             sku: "$zonewiseProducts.products.sku",
        //             CBD: "$zonewiseProducts.products.CBD",
        //             parentProductId: "$zonewiseProducts.products.parentProductId",
        //             units: "$zonewiseProducts.products.units",
        //             images: "$zonewiseProducts.products.images",
        //             units: "$zonewiseProducts.products.units",
        //             bannerImage: "$zonewiseProducts.products.bannerLogos",
        //             logoImage: "$zonewiseProducts.products.profileLogos",
        //             bannerLogos: "$zonewiseProducts.products.bannerLogos",
        //             profileLogos: "$zonewiseProducts.products.profileLogos",
        //             storeName: "$zonewiseProducts.products.sName",
        //             storeAddress: "$zonewiseProducts.products.storeAddr",
        //             storeLatitude: "$zonewiseProducts.products.coordinates.latitude",
        //             storeLongitude: "$zonewiseProducts.products.coordinates.longitude",
        //             offer: "$zonewiseProducts.products.offer",
        //             storeCoordinates: "$zonewiseProducts.products.coordinates",
        //         }
        //     },
        //     {
        //         $limit: params.limit // 5
        //     },
        //     { $skip: params.skip || 0 }
        // ]
        // )
        // .toArray((err, result) => { // normal select method
        //     return callback(err, result);
        // }); 
        db.get().collection("popularItem")
            .aggregate(
                [
                    // { $sort: { "timestamp": -1 } },
                    // { $limit: 1 },
                    // { $unwind: "$zonewiseProducts" },
                    // { $match: { "zonewiseProducts.zoneId": params.zoneId } },
                    // { $unwind: "$zonewiseProducts.products" },
                    {
                        $match: {
                            "franchiseId": params.franchiseId
                        }
                    }, {
                        $lookup: {
                            "from": "childProducts",
                            "localField": "childProductId",
                            "foreignField": "_id",
                            "as": "childProduct"
                        }
                    }, {
                        $unwind: "$childProduct"
                    }, {
                        $match: {
                            "childProduct.status": { '$in': [1, 6] }
                        }
                    }, {
                        $lookup: {
                            "from": "stores",
                            "localField": "franchiseId",
                            "foreignField": "_id",
                            "as": "store"
                        }
                    }, {
                        $unwind: "$store"
                    }, {
                        $project: {
                            productName: "$childProduct.productname",
                            productname: "$childProduct.productname",
                            childProductId: "$childProduct._id",
                            _id: "$childProduct._id",
                            franchiseId: "$childProduct.franchiseId",
                            THC: "$childProduct.THC",
                            sku: "$childProduct.sku",
                            CBD: "$childProduct.CBD",
                            parentProductId: "$childProduct.parentProductId",
                            units: "$childProduct.units",
                            images: "$childProduct.images",
                            bannerImage: "$store.bannerLogos",
                            logoImage: "$store.profileLogos",
                            bannerLogos: "$store.bannerLogos",
                            profileLogos: "$store.profileLogos",
                            storeName: "$store.sName",
                            storeAddress: "$store.storeAddr",
                            storeLatitude: "$store.coordinates.latitude",
                            storeLongitude: "$store.coordinates.longitude",
                            offer: "$childProduct.offer",
                            storeCoordinates: "$store.coordinates",
                        }
                    }, {
                        $skip: params.skip || 0
                    }, {
                        $limit: params.limit // 5
                    }
                ]
            )
            .toArray((err, result) => { // normal select method
                return callback(err, result);
            });
    }
    if (params.type == 2) { // highet ofers
        let offrCond = {
            "status": 1,
            "franchiseId": params.franchiseId,
            "offer.startDateTime": {
                $lt: moment().unix()
            },
            "offer.endDateTime": {
                $gt: moment().unix()
            },
            "offer.status": 1,
            "offer.discountValue": {
                $gt: 0
            }
        };
        if (params.offerId && params.offerId.length == 24) {
            offrCond = {
                "status": 1,
                "franchiseId": params.franchiseId,
                "offer.startDateTime": {
                    $lt: moment().unix()
                },
                "offer.endDateTime": {
                    $gt: moment().unix()
                },
                "offer.offerId": params.offerId,
                "offer.status": 1,
                "offer.discountValue": {
                    $gt: 0
                },
            };
        }
        db.get().collection(tableName)
            .aggregate([{
                $match: offrCond
            }, {
                $sort: {
                    "offer.discountValue": 1
                }
            }, {
                $skip: params.skip || 0
            }, {
                $limit: params.limit
            }, {
                $sort: {
                    "units.price['en']": 1
                }
            }, {
                $lookup: {
                    "from": "stores",
                    "localField": "franchiseId",
                    "foreignField": "_id",
                    "as": "stores"
                }
            }, {
                $unwind: "$stores"
            }, {
                $project: {
                    units: 1,
                    profileLogos: "$stores.profileLogos",
                    bannerImage: "$stores.bannerLogos",
                    THC: 1,
                    CBD: 1,
                    productName: 1,
                    productname: 1,
                    offer: 1,
                    price: 1,
                    franchiseId: 1,
                    images: 1,
                    parentProductId: 1,
                    upc: 1,
                    sku: 1,
                    currency: 1,
                    priceValue: 1,
                    storeName: "$stores.sName",
                    storeAddress: "$stores.storeAddr",
                    storeLogo: "$stores.images",
                    storeCoordinates: "$stores.coordinates"
                }
            }])
            .toArray((err, result) => { // normal select method
                return callback(err, result);
            });
    }
    if (params.type == 3) { // highet ofers
        let offrCond = {
            "status": 1,
            "franchiseId": params.franchiseId,
        };
        if (params.offerId && params.offerId.length == 24) {
            offrCond = {
                "status": 1,
                "franchiseId": params.franchiseId,
                "brand": new ObjectID(params.offerId)
            };
        }
        db.get().collection(tableName)
            .aggregate([{
                $match: offrCond
            }, {
                $sort: {
                    "offer.discountValue": 1
                }
            }, {
                $skip: params.skip || 0
            }, {
                $limit: params.limit
            }, {
                $sort: {
                    "units.price['en']": 1
                }
            }, {
                $lookup: {
                    "from": "stores",
                    "localField": "franchiseId",
                    "foreignField": "_id",
                    "as": "stores"
                }
            }, {
                $unwind: "$stores"
            }, {
                $project: {
                    units: 1,
                    profileLogos: "$stores.profileLogos",
                    bannerImage: "$stores.bannerLogos",
                    THC: 1,
                    CBD: 1,
                    productName: 1,
                    productname: 1,
                    offer: 1,
                    price: 1,
                    franchiseId: 1,
                    images: 1,
                    parentProductId: 1,
                    upc: 1,
                    sku: 1,
                    currency: 1,
                    priceValue: 1,
                    storeName: "$stores.sName",
                    storeAddress: "$stores.storeAddr",
                    storeLogo: "$stores.images",
                    storeCoordinates: "$stores.coordinates"
                }
            }])
            .toArray((err, result) => { // normal select method
                return callback(err, result);
            });
    }
}
/** 
 * @function
 * @name pushToCart 
 * @param {object} params - data coming from controller
 */
const pushToCart = (params, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate({
            _id: new ObjectID(params.childProductId)
        }, {
                $push: {
                    addedToCart: {
                        userId: params.userId,
                        unitId: params.unitId,
                        createdBy: params.createdBy,
                        timeStamp: moment().unix(),
                        isoDate: new Date()
                    }
                },

                $inc: {
                    addedToCartCount: 1
                }

            },
            { new: true },

            (err, result) => {

                return callback(err, result);
            });
}
/** 
 * @function
 * @name pushToOrdered 
 * @param {object} params - data coming from controller
 */
const pushToOrdered = (params, callback) => {
    db.get().collection(tableName)
        .update({
            _id: {
                $in: params.childProductId
            }
        }, {
                $push: {
                    ordered: {
                        userId: params.userId,
                        orderId: params.orderId,
                        createdBy: params.createdBy,
                        timeStamp: moment().unix(),
                        isoDate: new Date()
                    }
                },
                $inc: {
                    orderedCount: 1
                }
            }, {
                multi: true
            },
            (err, result) => {
                return callback(err, result);
            });
}
/** 
 * @function
 * @name pushToWishList 
 * @param {object} params - data coming from controller
 */
const pushToWishList = (params, callback) => {

    db.get().collection(tableName)
        .update({
            _id: new ObjectID(params.childProductId),
            // parentProductId: params.parentProductId,
            // "units": { $elemMatch: { unitId: params.unitId } }
        }, {
                $push: {
                    "wishList": {
                        listId: params.listId,
                        userId: params.userId,
                        createdBy: params.createdBy,
                        timeStamp: moment().unix(),
                        isoDate: new Date()
                    },
                    "wishListHistory": {
                        listId: params.listId,
                        userId: params.userId,
                        createdBy: params.createdBy,
                        timeStamp: moment().unix(),
                        isoDate: new Date()
                    }
                },
                $inc: {
                    wishListCount: 1
                }
            },
            (err, result) => {
                return callback(err, result);
            });
}
/** 
 * @function
 * @name pullfromWishList 
 * @param {object} params - data coming from controller
 */
const pullfromWishList = (params, callback) => {
    db.get().collection(tableName)
        .update({
            _id: new ObjectID(params.childProductId),
            // parentProductId: params.parentProductId 
        }, {
                $pull: {
                    wishList: {
                        listId: params.listId,
                        // "unitId": params.unitId ? params.unitId : "" 
                    }
                }
            },
            (err, result) => {
                return callback(err, result);
            });
}
/** 
 * @function
 * @name getWishItems 
 * @param {object} params - data coming from controller
 */
const getWishItems = (params, callback) => {
    db.get().collection(tableName)
        .aggregate(params)
        .toArray((err, result) => { // normal select method
            return callback(err, result);
        });
}
/** 
 * @function
 * @name isExistsWithIdPos 
 * @param {object} params - data coming from controller
 */
const isExistsWithIdPos = (params, callback) => {
    db.get().collection(tableName)
        .findOne({
            productPosId: params.productPosId
        }, {
                productName: 1,
                strainEffects: 1,
                priceValue: 1,
                shortDescription: 1,
                detailedDescription: 1,
                THC: 1,
                CBD: 1,
                thumbImage: 1,
                franchiseId: 1,
                images: 1,
                mobileImage: 1,
                secondCategoryName: 1,
                favorites: 1,
                units: 1,
                wishList: 1
            }, (err, result) => {
                return callback(err, result);
            });
}
/** 
 * @function
 * @name getHighestOffers 
 * @param {object} params - data coming from controller
 */
const getHighestOffers = (params, callback) => {
    db.get().collection(tableName)
        .aggregate(params)
        .toArray((err, result) => { // normal select method
            return callback(err, result);
        });
}
/** 
 * @function
 * @name getProductDetailsUnitId 
 * @param {object} params - data coming from controller
 */
const getProductDetailsUnitId = (params, callback) => {
    db.get().collection(tableName)
        .findOne({
            _id: params._id,
            "units.unitId": params.unitId,
            status: { '$in': [1, 6] }
        }, {
                productName: 1,
                productname: 1,
                strainEffects: 1,
                nutritionFactsInfo: 1,
                priceValue: 1,
                shortDescription: 1,
                sDescription: 1,
                detailDescription: 1,
                detailedDescription: 1,
                THC: 1,
                CBD: 1,
                thumbImage: 1,
                franchiseId: 1,
                images: 1,
                mobileImage: 1,
                secondCategoryName: 1,
                favorites: 1,
                units: 1,
                wishList: 1,
                offer: 1,
                taxes: 1,
                parentProductId: 1,
                sku: 1,
                upcName: 1,
                ingredients: 1,
                catName: 1,
                subCatName: 1,
                subSubCatName: 1,
                addOns: 1
            }, (err, result) => {
                return callback(err, result);
            });
}
/** 
 * @function
 * @name checkStock 
 * @param {object} params - data coming from controller
 */
const checkStock = (params, callback) => {
    db.get().collection(tableName)
        .findOne({
            _id: params._id,
            "units.unitId": params.unitId
        }, {
                productName: 1,
                productname: 1,
                strainEffects: 1,
                nutritionFactsInfo: 1,
                priceValue: 1,
                shortDescription: 1,
                sDescription: 1,
                detailDescription: 1,
                detailedDescription: 1,
                THC: 1,
                CBD: 1,
                thumbImage: 1,
                franchiseId: 1,
                images: 1,
                mobileImage: 1,
                secondCategoryName: 1,
                favorites: 1,
                units: 1,
                wishList: 1,
                offer: 1,
                taxes: 1,
                parentProductId: 1,
                sku: 1,
                upcName: 1,
                ingredients: 1,
                catName: 1,
                subCatName: 1,
                subSubCatName: 1,
                status: 1,
                addOns: 1
            }, (err, result) => {
                return callback(err, result);
            });
}

const patchProducts = (params, callback) => {
    db.get().collection(tableName)
        .update({
            _id: new ObjectID(params.childProductId)
        }, {
                $set: {
                    brand: params.brand ? new ObjectID(params.brand) : ""
                }
            },
            (err, result) => {
                return callback(err, result);
            });
}
/** 
 * @function
 * @name readBrands 
 * @param {object} params - data coming from controller
 */
const readBrands = (params, callback) => {
    db.get().collection(tableName)
        .aggregate([{
            $match: {
                "franchiseId": (params.franchiseId != 0) ? new ObjectID(params.franchiseId.toString()) : "",
                status: { '$in': [1, 6] }
            }
        }, {
            $group: {
                _id: "$brand",
                brand: {
                    "$first": "$brand"
                }
            }
        }, {
            $lookup: {
                "from": "brands",
                "localField": "brand",
                "foreignField": "_id",
                "as": "brands"
            }
        }, {
            $unwind: "$brands"
        }, {
            $match: {
                "brands.status": 1
            }
        }, {
            $project: {
                brandName: "$brands.name",
                description: "$brands.description",
                images: "$brands.images",
                bannerImage: "$brands.bannerImage",
                logoImage: "$brands.logoImage"
            }
        }])
        .toArray((err, result) => { // normal select method
            return callback(err, result);
        });
}

const insert = (params, callback) => {
    db.get().collection(tableName)
        .insert(params, (err, result) => {
            return callback(err, result);
        })
}

const update = (params, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate(params.q, params.data, params.options || {}, (err, result) => {
            return callback(err, result)
        })
}

const get = (params, callback) => {
    db.get({}).collection(tableName)
        .find({}).sort({
            _id: -1
        }).toArray((err, result) => {
            return callback(err, result[0]);
        });
}

const getOne = (params, callback) => {
    db.get().collection(tableName)
        .findOne(params, (err, result) => {
            return callback(err, result);
        })
}

const deleteItem = (params, callback) => {
    db.get().collection(tableName)
        .remove(params, (err, result) => {
            return callback(err, result);
        })
}

/** 
 * @function
 * @name getProductDetails  by productId
 * @param {object} params - data coming from controller
 */
const getProductDetailsById = (params, callback) => {
    db.get().collection(tableName)
        .find(params, {
            _id: 1,
            THC: 1,
            CBD: 1,
            status: 1,
            productName: 1,
            productname: 1,
            units: 1,
            price: 1,
            franchiseId: 1,
            images: 1,
            parentProductId: 1,
            upc: 1,
            sku: 1,
            currency: 1,
            priceValue: 1,
            offer: 1,
            brand: 1,
            addOns: 1,
            categoryName: 1,
            firstCategoryId: 1,
            firstCategoryName: 1,
            secondCategoryId: 1,
            subCatName: 1,
            secondCategoryName: 1,
            thirdCategoryId: 1,
            thirdCategoryName: 1,
            catName: 1,
            consumptionTime: 1
        }).toArray((err, result) => {
            return callback(err, result);
        });
}
function updateById(queryObj, callback) {
    db.get().collection(tableName).update(queryObj.query, queryObj.data, ((err, result) => {
        return callback(err, result);
    }));
}
const readAll = (condition, callback) => {
    db.get().collection(tableName).find(condition).toArray((err, result) => {
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
const getAllProductsById = (params, callback) => {
    db.get().collection(tableName).find(params).toArray((err, result) => { // normal select method
        return callback(err, result);
    });
}
module.exports = {
    getAllProductsById,
    getProductDetails,
    getProductsSubCatwise,
    getDataElastic,
    getElasticData,
    // getRecentlyAdded,
    pullFavorites,
    pushFavorites,
    patchViews,
    getFavorite,
    getFavoriteHome,
    pushToCart,
    pushToOrdered,
    pushToWishList,
    pullfromWishList,
    getWishItems,
    isExistsWithIdPos,
    getHighestOffers,
    getProductDetailsUnitId,
    checkStock,
    patchProducts,
    readBrands,
    insert,
    update,
    get,
    getOne,
    deleteItem,
    getProductsSubCatwiseProduct,
    getProductDetailsById,
    updateById,
    readAll,
    updateMany
}