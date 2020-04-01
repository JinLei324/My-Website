'use strict'

var childProducts = require('../../../../../models/childProducts');
var firstCategory = require('../../../../../models/firstCategory');
var stores = require('../../../../../models/stores');
var franchisefirstCategory = require('../../../../../models/franchisefirstCategory');
var franchisesecondCategory = require('../../../../../models/franchisesecondCategory');
var franchisethirdCategory = require('../../../../../models/franchisethirdCategory');
var franciseProducts = require('../../../../../models/franciseProducts');
var zone = require('../../../../../models/zones');
var storesElastic = require('../../../../../models/storeElastic');
var childProductsElastic = require('../../../../../models/childProductsElastic');
const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;
const async = require('async');

/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/

const handler = (request, reply) => {
    let franciseId = request.payload.franciseId;
    // 5ceb95ca087d927eaf32b896
    let franchiseStoreIDS = request.payload.franchiseStoreIDS;
    // let franchiseStoreIDS = [
    //     "5cebc5deff0929727e263e20",
    //     "5cf114229ed80f38708e8adc"
    // ];
    // let franchiseProductIDS = [
    //     "5cebc583087d9207593ca503",
    //     "5cf117c0087d9277b0275006"
    // ];
    let franchiseProductIDS = request.payload.franchiseProductIDS;
    let MultiStoreData = [];
    let MultiProductData = [];
    let MultiStoreIDS = [];
    let MultiProductIDS = [];
    const dbErrResponse = { message: request.i18n.__('genericErrMsg')['500'], code: 500 };
    let getAllStoreData = () => {
        return new Promise((resolve, reject) => {
            async.eachSeries(franchiseStoreIDS, (store, cb) => {
                MultiStoreIDS.push(new ObjectID(store))
                cb();
            }, (errOrder, resOrder) => {
                stores.getStoresByIds({ _id: { "$in": MultiStoreIDS }, "franchiseId": franciseId }, (err, result) => {
                    if (err) {
                        logger.error('Error occurred during get categories (getStoreCategoriesById): ' + JSON.stringify(err));
                        return reject(dbErrResponse)
                    }
                    MultiStoreData = result;
                    resolve(true)
                });
            });
        });
    }
    let getAllProductData = () => {
        return new Promise((resolve, reject) => {
            async.eachSeries(franchiseProductIDS, (product, cb) => {
                MultiProductIDS.push(new ObjectID(product))
                cb();
            }, (errOrder, resOrder) => {
                franciseProducts.getAllProductsById({ _id: { "$in": MultiProductIDS }, "franchiseId": franciseId }, (err, result) => {
                    if (err) {
                        logger.error('Error occurred during get categories (getStoreCategoriesById): ' + JSON.stringify(err));
                        return reject(dbErrResponse)
                    }
                    MultiProductData = result;
                    resolve(true)
                });
            });
        });
    }
    let insertData = () => {
        return new Promise((resolve, reject) => {

            async.eachSeries(MultiStoreData, (storeData, cbStore) => {
                async.eachSeries(MultiProductData, (productData, cbProduct) => {
                    let DataToInsert = Object.assign({}, productData);
                    DataToInsert["_id"] = new ObjectID();
                    DataToInsert["franciseProductId"] = productData["_id"];
                    DataToInsert["storeId"] = storeData["_id"];
                    DataToInsert["storeLatitude"] = storeData['coordinates']['latitude'];
                    DataToInsert["storeLongitude"] = storeData['coordinates']['longitude'];
                    DataToInsert["storeAverageRating"] = storeData['storeAverageRating'];
                    DataToInsert["storeType"] = storeData['storeType'];
                    DataToInsert["storeTypeMsg"] = storeData['storeTypeMsg'];
                    DataToInsert["storeCategoryId"] = storeData['storeCategory'][0]['categoryId'];
                    DataToInsert["storeCategoryName"] = storeData['storeCategory'][0]['categoryName'];
                    DataToInsert["storeName"] = storeData['name'];
                    DataToInsert["cityId"] = storeData['cityId'];
                    DataToInsert["zoneId"] = storeData['serviceZones'];
                    DataToInsert["name"] = productData['productname'];
                    delete (DataToInsert['productname']);
                    delete (DataToInsert['seqId']);
                    delete (DataToInsert['statusMsg']);
                    delete (DataToInsert['actions']);




                    childProducts.get({}, (err, result) => {
                        request.payload = Object.assign({}, DataToInsert);
                        if (result) {
                            request.payload.seqId = (typeof result.seqId == "undefined" || result.seqId == null) ? 1 : result.seqId + 1;
                        } else {
                            request.payload.seqId = 1;
                        }
                        request.payload.location = { lat: request.payload.storeLatitude, lon: request.payload.storeLongitude };
                        request.payload.productname = request.payload.name;
                        delete request.payload.storeName;
                        delete request.payload.name;
                        request.payload.createdTimestamp = moment().unix();
                        request.payload.storeId = (request.payload.storeId != "0") ? new ObjectID(request.payload.storeId) : "0";
                        request.payload.statusMsg = (request.payload.status == 1) ? 'Approved' : 'New';

                        request.payload.brand = (request.payload.brand && request.payload.brand.length == 24) ? new ObjectID(request.payload.brand) : "";

                        request.payload.storeId = String(request.payload.storeId);
                        request.payload.brand = String(request.payload.brand);
                        let id = String(request.payload._id);
                        childProductsElastic.Insert(request.payload, (err, resultelastic) => {
                            if (err) {
                                logger.error('Error occurred childProductsElastic search (Insert): ' + JSON.stringify(err));
                                return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500); // yunus
                            }
                            request.payload._id = new ObjectID(id);
                            request.payload.storeId = (request.payload.storeId != "0") ? new ObjectID(request.payload.storeId) : "0";
                            request.payload.brand = (request.payload.brand && request.payload.brand.length == 24) ? new ObjectID(request.payload.brand) : "";
                            request.payload.actions = [{
                                statusMsg: (request.payload.status == 1) ? 'Approved' : 'New',
                                userType: 'admin',
                                timeStamp: moment().unix(),
                                isoDate: new Date()
                            }];
                            childProducts.update({
                                q: {
                                    "_id": request.payload._id,
                                    storeId: request.payload.storeId,
                                    // status : 2
                                },
                                data: {
                                    $set: request.payload
                                },
                                options: { upsert: true, returnOriginal: false }
                            }, (err, result) => {
                                if (err) {
                                    logger.error('Error occurred childProducts   (Insert): ' + JSON.stringify(err));
                                    return reject(dbErrResponse)
                                }

                                if (request.payload.status == 1) {
                                    firstCategoryupdate();
                                    firstCategoryPush();
                                    if (request.payload.secondCategoryId && request.payload.secondCategoryId.length == 24) {
                                        secondCategoryupdate()
                                        secondCategoryPush()
                                    }
                                    if (request.payload.secondCategoryId && request.payload.secondCategoryId.length == 24 && request.payload.thirdCategoryId && request.payload.thirdCategoryId.length == 24) {
                                        thirdCategoryupdate()
                                        thirdCategoryPush()
                                    }
                                }
                                cbProduct();
                                //salseForce


                                function firstCategoryupdate() {
                                    stores.getOne({ // store
                                        "_id": (request.payload.storeId != "0") ? new ObjectID(request.payload.storeId) : "0",
                                        "catWiseProductCount": {
                                            $elemMatch: {
                                                "firstCategoryId": new ObjectID(request.payload.firstCategoryId)
                                            }
                                        }
                                    }, (err, result) => {
                                        if (result) {
                                            stores.update({
                                                q: {
                                                    "_id": (request.payload.storeId != "0") ? new ObjectID(request.payload.storeId) : "0",
                                                    "catWiseProductCount": {
                                                        $elemMatch: {
                                                            "firstCategoryId": new ObjectID(request.payload.firstCategoryId)
                                                        }
                                                    }
                                                }
                                                , data: {
                                                    $inc: { "catWiseProductCount.$.count": 1 },
                                                }
                                            }, (err, result) => {
                                                logger.info("updated count", err)
                                            });

                                        } else {
                                            stores.update({
                                                q: {
                                                    "_id": (request.payload.storeId != "0") ? new ObjectID(request.payload.storeId) : "0"
                                                }, data: {
                                                    $push: {
                                                        "catWiseProductCount": {
                                                            firstCategoryId: new ObjectID(request.payload.firstCategoryId),
                                                            count: 1
                                                        }
                                                    }
                                                }
                                            }, (err, result) => {
                                                // logger.info("created count", err)
                                            })
                                        }
                                    })
                                }
                                function firstCategoryPush() {
                                    let franchisefirstCategoryData = {};
                                    franchisefirstCategory.SelectOne({ _id: new ObjectID(request.payload.firstCategoryId) },
                                        (err, result) => {
                                            if (err) {

                                            } else {
                                                franchisefirstCategoryData = result;
                                                stores.getOne({ // store
                                                    "_id": (request.payload.storeId != "0") ? new ObjectID(request.payload.storeId) : "0",
                                                    "firstCategory": {
                                                        $elemMatch: {
                                                            "id": new ObjectID(request.payload.firstCategoryId)
                                                        }
                                                    }
                                                }, (err, resultstore) => {
                                                    if (resultstore) {
                                                    } else {
                                                        stores.update({
                                                            q: {
                                                                "_id": (request.payload.storeId != "0") ? new ObjectID(request.payload.storeId) : "0"
                                                            }, data: {
                                                                $push: {
                                                                    "firstCategory": {
                                                                        "categoryDesc": franchisefirstCategoryData.categoryDesc,
                                                                        "categoryName": franchisefirstCategoryData.categoryName,
                                                                        "id": new ObjectID(franchisefirstCategoryData._id.toString()),
                                                                        "seqID": franchisefirstCategoryData.seqID,
                                                                        "imageUrl": franchisefirstCategoryData.imageUrl
                                                                    }
                                                                }
                                                            }
                                                        }, (err, resultUpdate) => {
                                                            // logger.info("created count", err)
                                                        })
                                                    }
                                                })
                                            }
                                        });
                                }

                                function secondCategoryupdate() {
                                    stores.getOne({ // store
                                        "_id": (request.payload.storeId != "0") ? new ObjectID(request.payload.storeId) : "0",
                                        "subCatWiseProductCount": {
                                            $elemMatch: {
                                                "firstCategoryId": new ObjectID(request.payload.firstCategoryId),
                                                "secondCategoryId": new ObjectID(request.payload.secondCategoryId)
                                            }
                                        }
                                    }, (err, result) => {
                                        if (result) {
                                            stores.update({
                                                q: {
                                                    "_id": (request.payload.storeId != "0") ? new ObjectID(request.payload.storeId) : "0",
                                                    "subCatWiseProductCount": {
                                                        $elemMatch: {
                                                            "firstCategoryId": new ObjectID(request.payload.firstCategoryId),
                                                            "secondCategoryId": new ObjectID(request.payload.secondCategoryId)
                                                        }
                                                    }
                                                }
                                                , data: {
                                                    $inc: { "subCatWiseProductCount.$.count": 1 },
                                                }
                                            }, (err, result) => {
                                                logger.info("updated count", err)
                                            });

                                        } else {
                                            stores.update({
                                                q: {
                                                    "_id": (request.payload.storeId != "0") ? new ObjectID(request.payload.storeId) : "0"
                                                }, data: {
                                                    $push: {
                                                        "subCatWiseProductCount": {
                                                            "firstCategoryId": new ObjectID(request.payload.firstCategoryId),
                                                            "secondCategoryId": new ObjectID(request.payload.secondCategoryId),
                                                            count: 1
                                                        }
                                                    }
                                                }
                                            }, (err, result) => {
                                                // logger.info("created count", err)
                                            })
                                        }
                                    })
                                }
                                function secondCategoryPush() {
                                    let franchisesecondCategoryData = {};
                                    franchisesecondCategory.SelectOne({ _id: new ObjectID(request.payload.secondCategoryId) },
                                        (err, result) => {
                                            if (err) {

                                            } else {
                                                franchisesecondCategoryData = result;
                                                stores.getOne({ // store
                                                    "_id": (request.payload.storeId != "0") ? new ObjectID(request.payload.storeId) : "0",
                                                    "secondCategory": {
                                                        $elemMatch: {
                                                            "categoryId": new ObjectID(request.payload.firstCategoryId),
                                                            "id": new ObjectID(request.payload.secondCategoryId)
                                                        }
                                                    }
                                                }, (err, resultstore) => {
                                                    if (resultstore) {
                                                    } else {
                                                        stores.update({
                                                            q: {
                                                                "_id": (request.payload.storeId != "0") ? new ObjectID(request.payload.storeId) : "0"
                                                            }, data: {
                                                                $push: {
                                                                    "secondCategory": {
                                                                        "subCategoryDesc": franchisesecondCategoryData.subCategoryDesc,
                                                                        "subCategoryName": franchisesecondCategoryData.subCategoryName,
                                                                        "categoryId": new ObjectID(franchisesecondCategoryData.categoryId.toString()),
                                                                        "id": new ObjectID(franchisesecondCategoryData._id.toString()),
                                                                        "seqID": franchisesecondCategoryData.seqId,
                                                                        "imageUrl": franchisesecondCategoryData.imageUrl
                                                                    }
                                                                }
                                                            }
                                                        }, (err, resultUpdate) => {
                                                            // logger.info("created count", err)
                                                        })
                                                    }
                                                })
                                            }
                                        });
                                }

                                function thirdCategoryupdate() {
                                    stores.getOne({ // store
                                        "_id": (request.payload.storeId != "0") ? new ObjectID(request.payload.storeId) : "0",
                                        "subSubCatWiseProductCount": {
                                            $elemMatch: {
                                                "firstCategoryId": new ObjectID(request.payload.firstCategoryId),
                                                "secondCategoryId": new ObjectID(request.payload.secondCategoryId),
                                                "thirdCategoryId": request.payload.thirdCategoryId ? new ObjectID(request.payload.thirdCategoryId) : ""
                                            }
                                        }
                                    }, (err, result) => {
                                        if (result) {
                                            stores.update({
                                                q: {
                                                    "_id": (request.payload.storeId != "0") ? new ObjectID(request.payload.storeId) : "0",
                                                    "subSubCatWiseProductCount": {
                                                        $elemMatch: {
                                                            "firstCategoryId": new ObjectID(request.payload.firstCategoryId),
                                                            "secondCategoryId": new ObjectID(request.payload.secondCategoryId),
                                                            "thirdCategoryId": request.payload.thirdCategoryId ? new ObjectID(request.payload.thirdCategoryId) : ""
                                                        }
                                                    }
                                                }
                                                , data: {
                                                    $inc: { "subSubCatWiseProductCount.$.count": 1 },
                                                }
                                            }, (err, result) => {
                                                logger.warn("updated count", err)
                                            });

                                        } else {
                                            stores.update({
                                                q: {
                                                    "_id": (request.payload.storeId != "0") ? new ObjectID(request.payload.storeId) : "0"
                                                }, data: {
                                                    $push: {
                                                        "subSubCatWiseProductCount": {
                                                            "firstCategoryId": new ObjectID(request.payload.firstCategoryId),
                                                            "secondCategoryId": new ObjectID(request.payload.secondCategoryId),
                                                            "thirdCategoryId": request.payload.thirdCategoryId ? new ObjectID(request.payload.thirdCategoryId) : "",
                                                            count: 1
                                                        }
                                                    }
                                                }
                                            }, (err, result) => {
                                                // logger.info("created count", err)
                                            })
                                        }
                                    })
                                }
                                function thirdCategoryPush() {
                                    let franchisethirdCategoryData = {};
                                    franchisethirdCategory.SelectOne({ _id: new ObjectID(request.payload.thirdCategoryId) },
                                        (err, result) => {
                                            if (err) {

                                            } else {
                                                franchisethirdCategoryData = result;
                                                stores.getOne({ // store
                                                    "_id": (request.payload.storeId != "0") ? new ObjectID(request.payload.storeId) : "0",
                                                    "thirdCategory": {
                                                        $elemMatch: {
                                                            "categoryId": new ObjectID(request.payload.firstCategoryId),
                                                            "subCategoryId": new ObjectID(request.payload.secondCategoryId),
                                                            "id": request.payload.thirdCategoryId ? new ObjectID(request.payload.thirdCategoryId) : ""
                                                        }
                                                    }
                                                }, (err, resultstore) => {
                                                    if (resultstore) {
                                                    } else {
                                                        stores.update({
                                                            q: {
                                                                "_id": (request.payload.storeId != "0") ? new ObjectID(request.payload.storeId) : "0"
                                                            }, data: {
                                                                $push: {
                                                                    "thirdCategory": {
                                                                        "subSubCategoryDesc": franchisethirdCategoryData.subSubCategoryDesc,
                                                                        "subSubCategoryName": franchisethirdCategoryData.subSubCategoryName,
                                                                        "id": new ObjectID(franchisethirdCategoryData._id.toString()),
                                                                        "seqID": franchisethirdCategoryData.seqID,
                                                                        "subCategoryId": new ObjectID(franchisethirdCategoryData.subCategoryId.toString()),
                                                                        "categoryId": new ObjectID(franchisethirdCategoryData.categoryId.toString()),
                                                                        "imageUrl": franchisethirdCategoryData.imageUrl
                                                                    }
                                                                }
                                                            }
                                                        }, (err, resultUpdate) => {
                                                            // logger.info("created count", err)
                                                        })
                                                    }
                                                })
                                            }
                                        });
                                }
                            });
                        });

                    });

                }, (errProduct, resProduct) => {
                    if (errProduct) {
                        return reject(dbErrResponse)
                    } else {
                        cbStore();
                    }
                });
            }, (errStore, resStore) => {
                if (errStore) {
                    return reject(dbErrResponse)
                } else {
                    resolve(true)
                }

            });
        });
    }
    getAllStoreData()
        .then(getAllProductData)
        .then(insertData)
        .then(data => {
            return reply({
                message: request.i18n.__('genericErrMsg')['200'],
                data: data
            }).code(200);
        }).catch(e => {
            logger.error("Customer get Languages API error =>", e)
            return reply(dbErrResponse)
        });
};


/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = Joi.object({
    franciseId: Joi.string().required().description('franciseId'),
    franchiseStoreIDS: Joi.array().items().description('franchise storeIDS'),
    franchiseProductIDS: Joi.array().items().description('franchise ProductIDS'),
}).required();

/**
* A module that exports customer get cart handler, get cart validator! 
* @exports handler 
*/
module.exports = { handler, validator }