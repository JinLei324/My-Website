'use strict'

var childProducts = require('../../../../../models/childProducts');
var firstCategory = require('../../../../../models/firstCategory');
var childProductsElastic = require('../../../../../models/childProductsElastic');
const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;
const Async = require('async');
var zone = require('../../../../../models/zones');
var stores = require('../../../../../models/stores');
/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (request, reply) => {
    let statusMsg = '';
    switch (request.params.status) {
        case 1:
            statusMsg = 'Approved'
            break;
        case 3:
            statusMsg = 'Reject'
            break;
        case 4:
            statusMsg = 'Banned'
            break;
        case 6:
            statusMsg = 'InStock'
            break;
        case 5:
            statusMsg = 'Out of stock'
            break;

    }

    let productId = new ObjectID(request.params.productId);

    childProducts.getOne({ "_id": new ObjectID(request.params.productId) }, (err, childprodObj) => {
        if (err) {

            return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
        }
        if (childprodObj) {
            if ((request.params.status == 1 && childprodObj.status != 1) || (request.params.status == 6 && childprodObj.status != 6)) {
                childprodObj.inc = 1;
                firstCategoryupdate(childprodObj);
                if (childprodObj.secondCategoryId && childprodObj.secondCategoryId.length == 24) {
                    secondCategoryupdate(childprodObj)
                }
                if (childprodObj.secondCategoryId && childprodObj.secondCategoryId.length == 24 && childprodObj.thirdCategoryId && childprodObj.thirdCategoryId.length == 24) {
                    thirdCategoryupdate(childprodObj)
                }
            }
            if ((request.params.status == 3 && childprodObj.status != 3) || (request.params.status == 4 && childprodObj.status != 4) || (request.params.status == 5 && childprodObj.status != 5)) {
                childprodObj.inc = -1;
                firstCategoryupdate(childprodObj);
                if (childprodObj.secondCategoryId && childprodObj.secondCategoryId.length == 24) {
                    secondCategoryupdate(childprodObj)
                }
                if (childprodObj.secondCategoryId && childprodObj.secondCategoryId.length == 24 && childprodObj.thirdCategoryId && childprodObj.thirdCategoryId.length == 24) {
                    thirdCategoryupdate(childprodObj)
                }
            }

            // firstCategoryZone(childprodObj.firstCategoryId, childprodObj.storeId);
            // firstCategoryStoreRemove(childprodObj.firstCategoryId, childprodObj.storeId);
            // if (childprodObj.secondCategoryId)
            //     secondCategoryZone(childprodObj.secondCategoryId, childprodObj.storeId);
        }
    })


    childProducts.update({
        q: { "_id": productId },
        data: {
            $set: { status: request.params.status, statusMsg: statusMsg },
            $push: {
                actions: {
                    statusMsg: statusMsg,
                    userType: 'admin',
                    timeStamp: moment().unix(),
                    isoDate: new Date()
                }
            }
        }
    },
        (err, updateObj) => {

            if (err) {

                return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
            }

            // request.payload.storeId = String(request.payload.storeId);
            childProductsElastic.Update(productId.toString(), { status: request.params.status }, (err, resultelastic) => {
                if (err) {

                    return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                }
                // return reply({ message: error['products']['200'][0], data: resultelastic }).code(200);
                return reply({ message: request.i18n.__('products')['200'], data: resultelastic }).code(200);


            })

        });

    // childProducts.deleteItem({ "_id": productId }, (err, result) => {
    //     if (err) return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[0] }).code(500);

    //     childProductsElastic.Delete({ "_id": request.params.productId }, (err, resultelastic) => {
    //         if (err) return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[0], data: err }).code(500);

    //         return reply({ message: error['products']['200'][0], data: resultelastic }).code(200);
    //     });
    //     // return reply({ message: error['products']['200'][0], data: result }).code(200);
    // });

    // function secondCategoryZone(catId, storeId) {
    //     stores.getOne({ _id: new ObjectID(storeId) }, (err, result) => {
    //         if (result) {
    //             Async.forEach(result.serviceZones, function (item, callbackloop) {
    //                 if (item) {
    //                     zone.update({ _id: new ObjectID(item), secondCategory: new ObjectID(catId) }, { $unset: { "secondCategory.$": true } }, (err, result) => {

    //                         zone.update({ _id: new ObjectID(item) }, { $pull: { "secondCategory": null } }, (err, result) => {
    //                         })
    //                         callbackloop();
    //                     })
    //                 } else {
    //                     callbackloop();
    //                 }
    //             }, function (loopErr) {

    //             });
    //         }
    //     })
    // }


    // function firstCategoryZone(catId, storeId) {
    //     stores.getOne({ _id: new ObjectID(storeId) }, (err, result) => {
    //         if (result) {
    //             Async.forEach(result.serviceZones, function (item, callbackloop) {
    //                 if (item) {
    //                     zone.update({ _id: new ObjectID(item), firstCategory: new ObjectID(catId) }, { $unset: { "firstCategory.$": true } }, (err, result) => {
    //                         zone.update({ _id: new ObjectID(item) }, { $pull: { "firstCategory": null } }, (err, result) => {
    //                         })
    //                         callbackloop();
    //                     })
    //                 } else {
    //                     callbackloop();
    //                 }
    //             }, function (loopErr) {
    //             });
    //         }
    //     })
    // }
    // function firstCategoryStoreRemove(catId, storeId) {
    //     stores.updateS({ _id: new ObjectID(storeId), firstCategory: new ObjectID(catId) }, { $unset: { "firstCategory.$": true } }, (err, result) => {
    //         stores.updateS({ _id: new ObjectID(storeId) }, { $pull: { "firstCategory": null } }, (err, result) => {

    //         })
    //     })
    // }


    function firstCategoryupdate(childprodObj) {
        // firstCategory.getOne({
        //     "_id": new ObjectID(childprodObj.firstCategoryId),
        //     "list": {
        //         $elemMatch: {
        //             "storeId": String(childprodObj.storeId)
        //         }
        //     }
        // }, (err, result) => {
        //     if (result) {
        //         firstCategory.update({
        //             q: {
        //                 "_id": new ObjectID(childprodObj.firstCategoryId),
        //                 "list": {
        //                     $elemMatch: {
        //                         "storeId": String(childprodObj.storeId)
        //                     }
        //                 }
        //             }, data: {
        //                 "$inc": { "list.$.count": -1 }
        //             }
        //         }, function (err, result) {
        //             // logger.info("updated count")
        //         })
        //     }
        // })
        // // stores.update({ //yun
        // //     q: {
        // //         "_id": new ObjectID(childprodObj.storeId.toString()),
        // //         "catWiseProductCount": {
        // //             $elemMatch: {
        // //                 "firstCategoryId": new ObjectID(childprodObj.firstCategoryId)
        // //             }
        // //         }
        // //     }
        // //     , data: {
        // //         $inc: { "catWiseProductCount.$.count": childprodObj.inc },
        // //     }
        // // }, (err, result) => {
        // //     logger.info("updated count", err)
        // // });
        //
        stores.getOne({ // store
            "_id": new ObjectID(childprodObj.storeId.toString()),
            "catWiseProductCount": {
                $elemMatch: {
                    "firstCategoryId": new ObjectID(childprodObj.firstCategoryId)
                }
            }
        }, (err, result) => {
            if (result) {
                stores.update({
                    q: {
                        "_id": new ObjectID(childprodObj.storeId.toString()),
                        "catWiseProductCount": {
                            $elemMatch: {
                                "firstCategoryId": new ObjectID(childprodObj.firstCategoryId)
                            }
                        }
                    }
                    , data: {
                        $inc: { "catWiseProductCount.$.count": childprodObj.inc },
                    }
                }, (err, result) => {
                    logger.info("updated count", err)
                });

            } else {
                stores.update({
                    q: {
                        "_id": new ObjectID(childprodObj.storeId.toString())
                    }, data: {
                        $push: {
                            "catWiseProductCount": {
                                firstCategoryId: new ObjectID(childprodObj.firstCategoryId),
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
}


function secondCategoryupdate(childprodObj) {

    stores.getOne({ // store
        "_id": new ObjectID(childprodObj.storeId.toString()),
        "subCatWiseProductCount": {
            $elemMatch: {
                "firstCategoryId": new ObjectID(childprodObj.firstCategoryId),
                "secondCategoryId": new ObjectID(childprodObj.secondCategoryId)
            }
        }
    }, (err, result) => {
        if (result) {
            stores.update({
                q: {
                    "_id": new ObjectID(childprodObj.storeId.toString()),
                    "subCatWiseProductCount": {
                        $elemMatch: {
                            "firstCategoryId": new ObjectID(childprodObj.firstCategoryId),
                            "secondCategoryId": new ObjectID(childprodObj.secondCategoryId)
                        }
                    }
                }
                , data: {
                    $inc: { "subCatWiseProductCount.$.count": childprodObj.inc },
                }
            }, (err, result) => {
                logger.info("updated count", err)
            });

        } else {
            stores.update({
                q: {
                    "_id": new ObjectID(childprodObj.storeId.toString()),
                }, data: {
                    $push: {
                        "subCatWiseProductCount": {
                            "firstCategoryId": new ObjectID(childprodObj.firstCategoryId),
                            "secondCategoryId": new ObjectID(childprodObj.secondCategoryId),
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

function thirdCategoryupdate(childprodObj) {

    stores.getOne({ // store
        "_id": new ObjectID(childprodObj.storeId.toString()),
        "subSubCatWiseProductCount": {
            $elemMatch: {
                "firstCategoryId": new ObjectID(childprodObj.firstCategoryId),
                "secondCategoryId": new ObjectID(childprodObj.secondCategoryId),
                "thirdCategoryId": new ObjectID(childprodObj.thirdCategoryId)
            }
        }
    }, (err, result) => {
        if (result) {
            stores.update({
                q: {
                    "_id": new ObjectID(childprodObj.storeId.toString()),
                    "subSubCatWiseProductCount": {
                        $elemMatch: {
                            "firstCategoryId": new ObjectID(childprodObj.firstCategoryId),
                            "secondCategoryId": new ObjectID(childprodObj.secondCategoryId),
                            "thirdCategoryId": new ObjectID(childprodObj.thirdCategoryId)
                        }
                    }
                }
                , data: {
                    $inc: { "subSubCatWiseProductCount.$.count": childprodObj.inc },
                }
            }, (err, result) => {
                logger.info("updated count", err)
            });

        } else {
            stores.update({
                q: {
                    "_id": new ObjectID(childprodObj.storeId.toString()),
                }, data: {
                    $push: {
                        "subSubCatWiseProductCount": {
                            "firstCategoryId": new ObjectID(childprodObj.firstCategoryId),
                            "secondCategoryId": new ObjectID(childprodObj.secondCategoryId),
                            "thirdCategoryId": new ObjectID(childprodObj.thirdCategoryId),
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
const validator = {
    productId: Joi.string().description('productId'),
    status: Joi.number().integer().min(1).max(6).description('status 1 - approve, 3 - rejct 4- ban 5-out of stock 6-instock')
}

module.exports = { handler, validator }