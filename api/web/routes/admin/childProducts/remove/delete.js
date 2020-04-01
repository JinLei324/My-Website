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

    request.params.productId = JSON.parse(request.params.productId)
    let prodIds = [];
    var strarray = request.params.productId.split(',');



    for (let i = 0; i < strarray.length; i++) {
        if (strarray[i].length == 24) {
            prodIds.push(new ObjectID(strarray[i]));
        }
    }
    Async.each(prodIds, function (item, callback) {
        childProducts.getOne({ "_id": item }, (err, childprodObj) => {
            if (err) {

                return callback({ message: request.i18n.__('genericErrMsg')['500'], code: 500 });
            }
            if (childprodObj) {
                childProducts.update({
                    q: { "_id": item },
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
                }, (err, updateObj) => {

                    if (err) {

                        return callback({ message: request.i18n.__('genericErrMsg')['500'], code: 500 });
                    }

                    // request.payload.storeId = String(request.payload.storeId);
                    childProductsElastic.Update(item.toString(), { status: 2 }, (err, resultelastic) => {
                        if (err) {
                            return callback({ message: request.i18n.__('genericErrMsg')['500'], code: 500 });
                        }
                        if (childprodObj.status != 2) {
                            firstCategoryupdate(childprodObj);
                            if (childprodObj.secondCategoryId && childprodObj.secondCategoryId.length == 24) {
                                secondCategoryupdate(childprodObj)
                            }
                            if (childprodObj.secondCategoryId && childprodObj.secondCategoryId.length == 24 && childprodObj.thirdCategoryId && childprodObj.thirdCategoryId.length == 24) {
                                thirdCategoryupdate(childprodObj)
                            }
                        }

                        return callback({ message: request.i18n.__('products')['200'], data: resultelastic, code: 200 });
                    })

                });


            } else {
                return callback({ message: request.i18n.__('products')['404'], code: 404 });
            }
        })




    }, function (err) {
        if (err.code == 500) {
            return reply({ message: err.message }).code(err.code);
        }
        if (err.code == 404) {
            return reply({ message: err.message }).code(err.code);
        }

        return reply({ message: err.message, data: err.data }).code(err.code);

    })
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
    productId: Joi.string().description('productId "5ad5a1cce0dc3f78cd6dd079,5ad5b113e0dc3f2a183ddcd8"')
    // productId: Joi.array().items().description('productId'),
}

module.exports = { handler, validator }