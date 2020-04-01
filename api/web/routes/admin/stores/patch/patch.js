'use strict'

var stores = require('../../../../../models/stores');
const users = require("../../../../../models/users");
var storesElastic = require('../../../../../models/storeElastic');
const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;
const async = require('async');
var childProducts = require('../../../../../models/childProducts');
var childProductsElastic = require('../../../../../models/childProductsElastic');


const handler = (request, reply) => {
    let setData = {
        status: parseInt(request.payload.status),
        statusMsg: request.payload.statusMsg
    };
    let storeId = request.payload.storeId ? new ObjectID(request.payload.storeId) : ""
    stores.update({ q: { "_id": storeId }, data: { $set: setData } }, (err, updateObj) => {
        storesElastic.Update(storeId.toString(), setData, (err, resultelastic) => {
            if (err) {
                logger.error(err);
                //return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']), data: err }).code(500);
            }
            var condition = {};
            var conditionUser = {};
            if (parseInt(request.payload.status) == 1) {
                condition = {
                    query: { "storeId": storeId },
                    data: {
                        $set: { status: 1, statusMsg: 'Active' },
                        $push: {
                            actions: {
                                statusMsg: 'Active',
                                userType: 'admin',
                                timeStamp: moment().unix(),
                                isoDate: new Date()
                            }
                        }
                    }
                };
            } else {
                condition = {
                    query: { "storeId": storeId },
                    data: {
                        $set: { status: 2, statusMsg: 'InActive' },
                        $push: {
                            actions: {
                                statusMsg: 'InActive',
                                userType: 'admin',
                                timeStamp: moment().unix(),
                                isoDate: new Date()
                            }
                        }
                    }
                };
            }
            if (parseInt(request.payload.status) == 1) {
                conditionUser = {
                    query: { "storeId": storeId },
                    data: {
                        $set: { status: 1 },
                    }
                };
            } else {
                conditionUser = {
                    query: { "storeId": storeId },
                    data: {
                        $set: { status: 4 },
                    }
                };
            }
            users.updateMany(conditionUser, (err1, resultUser) => {
                if (err1) return reply({ message: request.i18n.__('genericErrMsg')['500'], data: err1 }).code(500);
                childProducts.updateMany(condition, (err, resultOne) => {
                    if (err) return reply({ message: request.i18n.__('genericErrMsg')['500'], data: err }).code(500);
                    else {

                        let updObj = {};
                        childProducts.readAll({ "storeId": storeId }, (err, result) => {
                            if (err) {
                                return reject(dbErrResponse);
                            }
                            else {
                                async.each(result, (item, callback) => {
                                    updObj = Object.assign({}, item);
                                    updObj.storeId = String(updObj.storeId);
                                    updObj.brand = String(updObj.brand);
                                    item._id = String(item._id);
                                    delete updObj._id;
                                    childProductsElastic.Update(item._id, updObj, (err, resultelastic) => {
                                        if (err)
                                            callback('err');
                                        else {
                                            if ((parseInt(request.payload.status) == 1 && item.status != 2)) {
                                                item.inc = 1;
                                                firstCategoryupdate(item);
                                                if (item.secondCategoryId && item.secondCategoryId.length == 24) {
                                                    secondCategoryupdate(item)
                                                }
                                                if (item.secondCategoryId && item.secondCategoryId.length == 24 && item.thirdCategoryId && item.thirdCategoryId.length == 24) {
                                                    thirdCategoryupdate(item)
                                                }
                                            }
                                            if (parseInt(request.payload.status) == 5 && item.status != 2) {
                                                item.inc = -1;
                                                firstCategoryupdate(item);
                                                if (item.secondCategoryId && item.secondCategoryId.length == 24) {
                                                    secondCategoryupdate(item)
                                                }
                                                if (item.secondCategoryId && item.secondCategoryId.length == 24 && item.thirdCategoryId && item.thirdCategoryId.length == 24) {
                                                    thirdCategoryupdate(item)
                                                }
                                            }
                                            callback();
                                        }

                                    })
                                }, function (err) {
                                    if (err) {
                                        return reply({ message: request.i18n.__('genericErrMsg')['500'], data: err }).code(500);
                                    }
                                    else {
                                        return reply({ message: request.i18n.__('store')['200'], data: {} }).code(200);
                                    }

                                });
                            }
                        });
                    }

                });
            });

            // return reply({ message: request.i18n.__('store')['200'], data: resultelastic }).code(200);
        })

        // return reply({ message: error['store']['200'], data: updateObj }).code(200);
    });

}

function firstCategoryupdate(childprodObj) {
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

    storeId: Joi.string().required().description('storeId'),
    status: Joi.number().required().description('status'),
    statusMsg: Joi.string().required().description('statusMsg'),

}

module.exports = { handler, validator }