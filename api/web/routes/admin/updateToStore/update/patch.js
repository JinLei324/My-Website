
'use strict'


const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');

const ObjectID = require('mongodb').ObjectID;
const async = require('async');
const errorMsg = require('../../../../../locales');
const storeCategory = require('../../../../../models/storeCategory');
const storeSubCategory = require('../../../../../models/storeSubCategory');

const stores = require('../../../../../models/stores');
const storeElastic = require('../../../../../models/storeElastic');

const validator = Joi.object({
    _id: Joi.string().required().description('id is required'),
    type: Joi.string().required().description('1: Update First Category Data <br/> 2 : Update Second Category Data  <br/> 3 : Update Third Category Data <br/>  4: Update Brand Data <br/> 5: Update Manufacturer Data'),
}).required();






const handler = (request, reply) => {
    const dbErrResponse = request.i18n.__('genericErrMsg')['500'];

    let firstCategoryData = {};
    let SubCategoryData = {};

    var conditionForProduct = {};

    const updateDataToElastic = () => {
        return new Promise((resolve, reject) => {

            let updObj = {};
            stores.readAll(conditionForProduct, (err, result) => {
                if (err) {
                    return reject(dbErrResponse);
                }
                else {
                    async.each(result, (item, callback) => {
                        updObj = Object.assign({}, item);
                        item._id = String(item._id);
                        delete updObj._id;
                        storeElastic.Update(item._id, updObj, (err, resultelastic) => {
                            if (err)
                                callback('err');
                            else
                                callback();
                        })
                    }, function (err) {
                        if (err) {
                            return reject(dbErrResponse);
                        }
                        else {
                            return resolve(true);
                        }

                    });
                }
            });

        });
    }

    //First Category
    const getFirstCategoryData = () => {
        return new Promise((resolve, reject) => {
            var condition = { _id: new ObjectID(request.payload._id) };

            storeCategory.SelectOne(condition, (err, result) => {
                if (err)
                    return reject(dbErrResponse);
                else {
                    firstCategoryData = result;
                    return resolve(true);
                }
            });
        });
    }

    const setFirstCategoryData = () => {
        return new Promise((resolve, reject) => {
            let storeCategory = [{
                "categoryId": String(firstCategoryData['_id']),
                "categoryName": firstCategoryData['storeCategoryName'],
            }];
            var condition = {
                query: { "storeCategory.categoryId": firstCategoryData._id.toString() },
                data: {
                    $set: {
                        "storeCategory": storeCategory,
                        "storeType": firstCategoryData['type'],
                        "storeTypeMsg": firstCategoryData['typeName'],
                        "cartsAllowed": firstCategoryData['cartsAllowed'],
                        "cartsAllowedMsg": firstCategoryData['cartsAllowedMsg']
                    }
                }
            };
            stores.updateMany(condition, (err, result) => {
                if (err) {
                    return reject(dbErrResponse);
                }
                else {
                    return resolve(true);
                }

            });
        });
    }
    //SubCategoryData
    const getSubCategoryData = () => {
        return new Promise((resolve, reject) => {
            var condition = { _id: new ObjectID(request.payload._id) };

            storeSubCategory.SelectOne(condition, (err, result) => {
                if (err)
                    return reject(dbErrResponse);
                else {
                    SubCategoryData = result;
                    return resolve(true);
                }
            });
        });
    }

    const setSubCategoryData = () => {
        return new Promise((resolve, reject) => {
            let storeSubCategory = [{
                "subCategoryId": String(SubCategoryData['_id']),
                "subCategoryName": SubCategoryData['storeSubCategoryName'],
                "subCategoryIconImage": SubCategoryData['iconImage'],
            }];
            var condition = {
                query: { "storeSubCategory.subCategoryId": SubCategoryData._id.toString() },
                data: {
                    $set: {
                        "storeSubCategory": storeSubCategory
                    }
                }
            };
            stores.updateMany(condition, (err, result) => {
                if (err) {
                    return reject(dbErrResponse);
                }
                else {
                    return resolve(true);
                }

            });
        });
    }


    switch (parseInt(request.payload.type)) {
        case 1:
            // firstCategory Id
            conditionForProduct = { "storeCategory.categoryId": request.payload._id };
            getFirstCategoryData()
                .then(setFirstCategoryData)
                .then(updateDataToElastic)
                .then(data => {
                    return reply({ message: request.i18n.__('genericErrMsg')['200'] }).code(200);
                }).catch(e => {

                    return reply({ message: e }).code(500);
                });
            break;

        case 2:
            // subCategory Id
            conditionForProduct = { "storeSubCategory.subCategoryId": request.payload._id };
            getSubCategoryData()
                .then(setSubCategoryData)
                .then(updateDataToElastic)
                .then(data => {
                    return reply({ message: request.i18n.__('genericErrMsg')['200'] }).code(200);
                }).catch(e => {

                    return reply({ message: e }).code(500);
                });
            break;

        default:
            break;
    }


}
module.exports = { handler, validator }
