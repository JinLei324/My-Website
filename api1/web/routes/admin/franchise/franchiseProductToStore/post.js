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
const Async = require('async');

/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/

const handler = (request, reply) => {
    // childProducts.getOne({ // store
    //     "_id": (request.payload.franciseProductId != "0") ? new ObjectID(request.payload.franciseProductId) : "0",
    //     "storeId": (request.payload.storeId != "0") ? new ObjectID(request.payload.storeId) : "0"
    // }, (err, result) => {
    //     if (result.length > 0) {
    //         return reply({ message: request.i18n.__('genericErrMsg')['500'], data: err }).code(500); // yun
    // } else {

    childProducts.get({}, (err, result) => {
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
        let id = request.payload._id;
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
                    return reply({ message: request.i18n.__('genericErrMsg')['500'], data: err }).code(500); // yun
                }

                // stores.getOne({ _id: (request.payload.storeId != "0") ? new ObjectID(request.payload.storeId) : "0" }, (err, storedataObj) => {
                //     delete storedataObj._id;
                //     storesElastic.Update(request.payload.storeId.toString(), storedataObj, (err, resultelastic) => {
                //         if (err)
                //             return reply({ message: request.i18n.__('genericErrMsg')['500'], data: err }).code(500);
                //     })
                // })
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
                // if (request.payload.status == 1) {
                //     firstCategoryPush();
                //     if (request.payload.secondCategoryId && request.payload.secondCategoryId.length == 24) {
                //         secondCategoryPush()
                //     }
                //     if (request.payload.secondCategoryId && request.payload.secondCategoryId.length == 24 && request.payload.thirdCategoryId && request.payload.thirdCategoryId.length == 24) {
                //         thirdCategoryPush()
                //     }
                // }

                //salseForce
                return reply({ message: request.i18n.__('products')['200'], data: result }).code(200);

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
                                logger.info("updated count", err)
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
    //     }
    // })
};


/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    _id: Joi.string().required().description('_id'),
    franciseProductId: Joi.string().required().description('francise ProductId'),
    productName: Joi.array().items().description('productName'),
    firstCategoryId: Joi.string().required().description('firstCategoryId'),
    secondCategoryId: Joi.string().allow('').description('secondCategoryId'),
    thirdCategoryId: Joi.string().allow('').description('thirdCategoryId'),
    firstCategoryName: Joi.string().required().description('firstCategoryName'),
    secondCategoryName: Joi.string().allow('').description('secondCategoryName'),
    thirdCategoryName: Joi.string().allow('').description('thirdCategoryName'),
    sku: Joi.string().allow('').description('sku'),
    barcode: Joi.string().description('barcode').allow(""),
    shortDescription: Joi.string().required().description('shortDescription'),
    detailedDescription: Joi.string().allow('').description('detailedDescription'),
    POSName: Joi.string().allow('').description('POSName'),
    barcodeFormat: Joi.string().allow('').description('barcodeFormat'),
    THC: Joi.string().required().description('THC'),
    CBD: Joi.string().required().description('CBD'),
    units: Joi.array().items().description('units'),
    strainEffects: Joi.object().keys().description('strainEffects'),
    medicalAttributes: Joi.object().keys().description('medicalAttributes'),
    negativeAttributes: Joi.object().keys().description('negativeAttributes'),
    flavours: Joi.object().keys().description('flavours'),
    images: Joi.array().items().description('images'),
    type: Joi.string().allow('').description('type'),
    upc: Joi.string().allow('').description('upc'),
    mpn: Joi.string().allow('').description('mpn'),
    model: Joi.string().allow('').description('model'),
    shelflifeuom: Joi.string().allow('').description('shelflifeuom'),
    storageTemperature: Joi.string().allow('').description('storageTemperature'),
    storageTemperatureUOM: Joi.string().allow('').description('storageTemperatureUOM'),
    warning: Joi.string().allow('').description('warning'),
    allergyInformation: Joi.string().allow('').description('allergyInformation'),
    nutritionFacts: Joi.object().keys().description('nutritionFacts'),
    container: Joi.string().allow('').description('container'),
    size: Joi.string().allow('').description('size'),
    sizeUom: Joi.string().allow('').description('sizeUom'),
    servingsPerContainer: Joi.string().allow('').description('servingsPerContainer'),
    height: Joi.string().allow('').description('height'),
    width: Joi.string().allow('').description('width'),
    length: Joi.string().allow('').description('length'),
    weight: Joi.string().allow('').description('weight'),
    genre: Joi.string().allow('').description('genre'),
    label: Joi.string().allow('').description('label'),
    artist: Joi.string().allow('').description('artist'),
    actor: Joi.string().allow('').description('actor'),
    director: Joi.string().allow('').description('director'),
    clothingSize: Joi.string().allow('').description('clothingSize'),
    color: Joi.string().allow('').description('color'),
    features: Joi.string().allow('').description('features'),
    manufacturer: Joi.string().allow('').description('manufacturer'),
    brand: Joi.string().allow('').description('brand'),
    publisher: Joi.string().allow('').description('publisher'),
    author: Joi.string().allow('').description('author'),
    currentDate: Joi.string().allow('').description('currentDate'),
    storeId: Joi.string().description('storeId'),
    parentProductId: Joi.string().allow('').description('parentProductId'),
    itemKey: Joi.string().allow('').description('itemKey'),
    fileName: Joi.string().allow('').description('fileName'),
    productPosId: Joi.string().allow('').description('productPosId'),
    colors: Joi.array().items().description('colors'),
    sizes: Joi.array().items().description('sizes'),
    manufacturerName: Joi.string().allow('').description('manufacturerName'),
    brandName: Joi.string().allow('').description('brandName'),

    zoneId: Joi.array().items().description('zoneId'),
    cityId: Joi.string().allow('').description('cityId'),
    storeLatitude: Joi.number().description('Latitude'),
    storeLongitude: Joi.number().description('Longitude'),
    storeAverageRating: Joi.number().description('storeAverageRating').allow(""),
    name: Joi.object().keys().description('name'),
    storeName: Joi.array().items().description('storeName'),
    storeAddress: Joi.array().items().description('storeAddress'),
    // status: Joi.number().description('status').allow(null),
    taxes: Joi.array().items().description('taxes'),


    storeType: Joi.number().required().description('storeType'),
    storeTypeMsg: Joi.string().required().description('storeTypeMsg'),
    storeCategoryId: Joi.string().description('storeCategory Id'),
    storeCategoryName: Joi.object().keys().description('storeCategory Name'),


    // unitPosId: Joi.string().allow('').description('unitPosId')
    categoryName: Joi.array().items().description('categoryName'),
    subCategoryName: Joi.array().items().description('subCategoryName'),
    subSubCategoryName: Joi.array().items().description('subSubCategoryName'),
    pName: Joi.object().keys().description('name'),
    sDescription: Joi.object().keys().description('sDescription'),
    detailDescription: Joi.object().keys().description('detailDescription'),
    catName: Joi.object().keys().description('catName'),
    subCatName: Joi.object().keys().description('subCatName'),
    subSubCatName: Joi.object().keys().description('subSubCatName'),
    shortDesc: Joi.array().items().description('shortDesc'),
    detailedDesc: Joi.array().items().description('detailedDesc'),
    pos: Joi.object().keys().description('pos'),
    POSNam: Joi.array().items().description('posNam'),

    upcName: Joi.object().keys().description('upcName'),
    mpnName: Joi.object().keys().description('mpnName'),
    modelName: Joi.object().keys().description('modelName'),
    uomShelfLife: Joi.object().keys().description('uomShelfLife'),
    UOMstorageTemperature: Joi.object().keys().description('UOMstorageTemperature'),
    warningName: Joi.object().keys().description('warningName'),
    allergyInfo: Joi.object().keys().description('allergyInfo'),
    nutritionFactsInfo: Joi.object().keys().description('nutritionFactsInfo'),
    containerName: Joi.object().keys().description('containerName'),
    containerPerServings: Joi.object().keys().description('containerPerServings'),
    genreName: Joi.object().keys().description('genreName'),
    labelName: Joi.object().keys().description('labelName'),
    artistName: Joi.object().keys().description('artistName'),
    actorName: Joi.object().keys().description('actorName'),
    directorName: Joi.object().keys().description('directorName'),
    featureName: Joi.object().keys().description('featureName'),
    publisherName: Joi.object().keys().description('publisherName'),
    authorName: Joi.object().keys().description('authorName'),
    store: Joi.object().keys().description('store'),
    sizename: Joi.object().keys().description('sizename'),
    taxname: Joi.object().keys().description('taxname'),
    colorname: Joi.object().keys().description('colorname'),
    manufactureName: Joi.object().keys().description('manufactureName'), // new structure
    brandTitle: Joi.object().keys().description('brandTitle'),
    status: Joi.number().integer().required().min(0).max(1).description('status 0 - new, 1 - approve'),
    hsnCode: Joi.object().keys().description('hsnCode'),
    createdTimestamp: Joi.any().allow(""),
    ingredients: Joi.object().keys().description('ingredients'),
    franchiseId: Joi.string().description('franchiseId').allow(""),
    addOns: Joi.any().description("add on ids").allow(""),
    consumptionTime: Joi.any().description("consumption Time"),

    currency: Joi.string().description('currency').allow(""),
    currencySymbol: Joi.string().description('currencySymbol').allow(""),
    productType: Joi.number().integer().min(1).max(2).description('status 1 - Generic, 2 - Branded'),
    productTypeMsg: Joi.string().description('productType Message').allow(""),
    symptoms: Joi.array().items().description('symptoms'),
    selectiveGeneric: Joi.array().items().description('selective generic'),
    selectiveBranded: Joi.array().items().description('selective brands'),
    rx: Joi.any().allow(""),
    prescriptionRequired: Joi.any().allow(""),
    serialNumber: Joi.string().description('serialNumber').allow(""),
    professionalUsageFile: Joi.string().description('professionalUsageFile').allow(""),
    personalUsageFile: Joi.string().description('personalUsageFile').allow(""),
    soldOnline: Joi.any().allow(""),
}

/**
* A module that exports customer get cart handler, get cart validator! 
* @exports handler 
*/
module.exports = { handler, validator }