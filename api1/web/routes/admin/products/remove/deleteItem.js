'use strict'

var products = require('../../../../../models/products');
var productsElastic = require('../../../../../models/productElastic');
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

    // request.params.productId = JSON.parse(request.params.productId)

    let prodIds = [];
    let prodId = [];
    // var strarray = request.params.productId.split(',');

    // for (let i = 0; i < strarray.length; i++) {
    //     if (strarray[i].length == 24) {
    prodIds.push(new ObjectID(request.params.productId));
    prodId.push(request.params.productId);
    //     }
    // }

    let condition = {
        "parentProductId": { '$in': prodId }
    };
    if (request.params.storeId != "0") {
        condition['storeId'] = new ObjectID(request.params.storeId)
    }
    // let productId = new ObjectID(request.params.productId);

    childProducts.getProductDetailsById(condition, (err, childprodObj) => {
        if (err) {

            return callback({ message: request.i18n.__('genericErrMsg')['500'], code: 500 });
        }

        if (childprodObj.length > 0) {
            Async.each(childprodObj, function (item, callback) {
                if (item) {
                    childProducts.deleteItem({
                        "_id": new ObjectID(item._id.toString())
                    }, (err, updateObj) => {

                        if (err) {

                            return callback({ message: request.i18n.__('genericErrMsg')['500'], code: 500 });
                        }

                        childProductsElastic.Delete({ "_id": item._id.toString() }, (err, resultelastic) => {
                            if (err) {
                                return callback({ message: request.i18n.__('genericErrMsg')['500'], code: 500 });
                            }
                            firstCategoryupdate(item);
                            if (item.secondCategoryId && item.secondCategoryId.length == 24) {
                                secondCategoryupdate(item)
                            }
                            if (item.secondCategoryId && item.secondCategoryId.length == 24 && item.thirdCategoryId && item.thirdCategoryId.length == 24) {
                                thirdCategoryupdate(item)
                            }

                            return callback({ message: request.i18n.__('products')['200'], data: resultelastic, code: 200 });
                        })

                    });


                } else {
                    return callback({ message: request.i18n.__('products')['404'], code: 404 });
                }

            }, function (err) {
                if (err.code == 500) {
                    return reply({ message: err.message }).code(err.code);
                }
                if (err.code == 404) {
                    return reply({ message: err.message }).code(err.code);
                }
                if (request.params.storeId == "0") {
                    products.deleteItem({ "_id": { '$in': prodIds } }, (err, result) => {

                        if (err) return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']), data: err }).code(500);
                        return reply({ message: error['products']['200'], data: result }).code(200);
                    });
                }
                else {
                    return reply({ message: error['products']['200'], data: {} }).code(200);
                }


            })

        } else {
            if (request.params.storeId == "0") {
                products.deleteItem({ "_id": { '$in': prodIds } }, (err, result) => {

                    if (err) return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']), data: err }).code(500);
                    return reply({ message: error['products']['200'], data: result }).code(200);

                });
            }
            else {
                return reply({ message: error['products']['200'], data: {} }).code(200);
            }
        }
    });




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
    productId: Joi.string().description('productId "5ad5a1cce0dc3f78cd6dd079,5ad5b113e0dc3f2a183ddcd8"'),
    storeId: Joi.string().description('storeId for central product pass 0 other wise storeId')
    // productId: Joi.array().items().description('productId'),
}

module.exports = { handler, validator }