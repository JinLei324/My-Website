'use strict'

var stores = require('../../../../../models/stores');
var storesElastic = require('../../../../../models/storeElastic');
const i18n = require('../../../../../locales/locales');

// response messages based on language 
const users = require("../../../../../models/users");
const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;
const async = require('async');
var childProducts = require('../../../../../models/childProducts');
var childProductsElastic = require('../../../../../models/childProductsElastic');

/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (request, reply) => {

    let storeId = new ObjectID(request.params.storeId);

    stores.update({ q: { "_id": storeId }, data: { $set: { status: 7 } } }, (err, updateObj) => {

        if (err) return reply({ message: request.i18n.__('genericErrMsg')['500'], data: err }).code(500);


        storesElastic.Update(storeId.toString(), { status: 7 }, (err, resultelastic) => {
            if (err) return reply({ message: request.i18n.__('genericErrMsg')['500'], data: err }).code(500);

            var condition = {
                query: { "storeId": storeId },
                data: {
                    $set: { status: 2, statusMsg: 'Deleted' },
                    $push: {
                        actions: {
                            statusMsg: 'Deleted',
                            userType: 'admin',
                            timeStamp: moment().unix(),
                            isoDate: new Date()
                        }
                    }
                }
            };
            var conditionUser = {
                query: { "storeId": storeId },
                data: {
                    $set: { status: 5 },
                }
            };
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
                                            if (item.status != 2) {
                                                firstCategoryupdate(item);
                                                if (item.secondCategoryId && item.secondCategoryId.length == 24) {
                                                    secondCategoryupdate(item)
                                                }
                                                if (item.secondCategoryId && item.secondCategoryId.length == 24 && item.thirdCategoryId && childprodObj.thirdCategoryId.length == 24) {
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



        })
    });
}




function firstCategoryupdate(childprodObj) {

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
            $inc: { "catWiseProductCount.$.count": -1 },
        }
    }, (err, result) => {
        logger.info("updated count", err)
    });
}


function secondCategoryupdate(childprodObj) {
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
            $inc: { "subCatWiseProductCount.$.count": -1 },
        }
    }, (err, result) => {
        logger.info("updated count", err)
    });
}
function thirdCategoryupdate(childprodObj) {
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
            $inc: { "subSubCatWiseProductCount.$.count": -1 },
        }
    }, (err, result) => {
        logger.info("updated count", err)
    });
}
const validator = {

    storeId: Joi.string().required().description('storeId')
}

module.exports = { handler, validator }