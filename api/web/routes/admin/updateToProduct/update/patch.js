
'use strict'


const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');

const ObjectID = require('mongodb').ObjectID;
const async = require('async');
const errorMsg = require('../../../../../locales');
const firstCategory = require('../../../../../models/firstCategory');
const secondCategory = require('../../../../../models/secondCategory');
const thirdCategory = require('../../../../../models/thirdCategory');
const brands = require('../../../../../models/brands');
const manufacturer = require('../../../../../models/manufacturer');

const childProducts = require('../../../../../models/childProducts');
const childProductsElastic = require('../../../../../models/childProductsElastic');

const validator = Joi.object({
    _id: Joi.string().required().description('id is required'),
    type: Joi.string().required().description('1: Update First Category Data <br/> 2 : Update Second Category Data  <br/> 3 : Update Third Category Data <br/>  4: Update Brand Data <br/> 5: Update Manufacturer Data'),
}).required();






const handler = (request, reply) => {
    const dbErrResponse = request.i18n.__('genericErrMsg')['500'];

    let firstCategoryData = {};
    let secondCategoryData = {};
    let thirdCategoryData = {};
    let brandData = {};
    let manufacturerData = {};

    var conditionForProduct = {};
    const updateDataToElastic = () => {
        return new Promise((resolve, reject) => {

            let updObj = {};
            childProducts.readAll(conditionForProduct, (err, result) => {
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

            firstCategory.SelectOne(condition, (err, result) => {
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

            var condition = {
                query: { "firstCategoryId": firstCategoryData._id.toString() },
                data: {
                    $set: {
                        "firstCategoryName": firstCategoryData['categoryName']['en'],
                        "categoryName": firstCategoryData['name'],
                        "catName": firstCategoryData['categoryName']
                    }
                }
            };
            childProducts.updateMany(condition, (err, result) => {
                if (err) {
                    return reject(dbErrResponse);
                }
                else {
                    return resolve(true);
                }

            });
        });
    }


    //Second Category
    const getSecondCategoryData = () => {
        return new Promise((resolve, reject) => {
            var condition = { _id: new ObjectID(request.payload._id) };

            secondCategory.SelectOne(condition, (err, result) => {
                if (err)
                    return reject(dbErrResponse);
                else {
                    secondCategoryData = result;
                    return resolve(true);
                }
            });
        });
    }

    const setSecondCategoryData = () => {
        return new Promise((resolve, reject) => {

            var condition = {
                query: { "secondCategoryId": secondCategoryData._id.toString() },
                data: {
                    $set: {
                        "secondCategoryName": secondCategoryData['subCategoryName']['en'],
                        "subCategoryName": secondCategoryData['name'],
                        "subCatName": secondCategoryData['subCategoryName']
                    }
                }
            };
            childProducts.updateMany(condition, (err, result) => {
                if (err) {
                    return reject(dbErrResponse);
                }
                else {
                    return resolve(true);
                }

            });
        });
    }

    //Second Category
    const getThirdCategoryData = () => {
        return new Promise((resolve, reject) => {
            var condition = { _id: new ObjectID(request.payload._id) };

            thirdCategory.SelectOne(condition, (err, result) => {
                if (err)
                    return reject(dbErrResponse);
                else {
                    thirdCategoryData = result;
                    return resolve(true);
                }
            });
        });
    }

    const setThirdCategoryData = () => {
        return new Promise((resolve, reject) => {

            var condition = {
                query: { "thirdCategoryId": thirdCategoryData._id.toString() },
                data: {
                    $set: {
                        "thirdCategoryName": thirdCategoryData['subSubCategoryName']['en'],
                        "subSubCategoryName": thirdCategoryData['name'],
                        "subSubCatName": thirdCategoryData['subSubCategoryName']
                    }
                }
            };
            childProducts.updateMany(condition, (err, result) => {
                if (err) {
                    return reject(dbErrResponse);
                }
                else {
                    return resolve(true);
                }

            });
        });
    }


    //Brands
    const getBrandsData = () => {
        return new Promise((resolve, reject) => {
            var condition = { _id: new ObjectID(request.payload._id) };

            brands.SelectOne(condition, (err, result) => {
                if (err)
                    return reject(dbErrResponse);
                else {
                    brandData = result;
                    return resolve(true);
                }
            });
        });
    }

    const setBrandsData = () => {
        return new Promise((resolve, reject) => {

            var condition = {
                query: { "secondCategoryId": brandData._id.toString() },
                data: {
                    $set: {
                        "brandName": brandData['name']['en'],
                        "brandTitle": brandData['name']
                    }
                }
            };
            childProducts.updateMany(condition, (err, result) => {
                if (err) {
                    return reject(dbErrResponse);
                }
                else {
                    return resolve(true);
                }

            });
        });
    }

    //Manufacturer 
    const getManufacturerData = () => {
        return new Promise((resolve, reject) => {
            var condition = { _id: new ObjectID(request.payload._id) };

            manufacturer.SelectOne(condition, (err, result) => {
                if (err)
                    return reject(dbErrResponse);
                else {
                    manufacturerData = result;
                    return resolve(true);
                }
            });
        });
    }

    const setManufacturerData = () => {
        return new Promise((resolve, reject) => {

            var condition = {
                query: { "manufacturer": manufacturerData._id.toString() },
                data: {
                    $set: {
                        "manufacturerName": manufacturerData['name']['en']
                    }
                }
            };
            childProducts.updateMany(condition, (err, result) => {
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
            conditionForProduct = { firstCategoryId: request.payload._id };
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
            // second Category Id
            conditionForProduct = { secondCategoryId: request.payload._id };
            getSecondCategoryData()
                .then(setSecondCategoryData)
                .then(updateDataToElastic)
                .then(data => {
                    return reply({ message: request.i18n.__('genericErrMsg')['200'] }).code(200);
                }).catch(e => {

                    return reply({ message: e }).code(500);
                });
            break;
        case 3:
            // third Category Id
            conditionForProduct = { thirdCategoryId: request.payload._id };
            getThirdCategoryData()
                .then(setThirdCategoryData)
                .then(updateDataToElastic)
                .then(data => {
                    return reply({ message: request.i18n.__('genericErrMsg')['200'] }).code(200);
                }).catch(e => {

                    return reply({ message: e }).code(500);
                });
            break;
        case 4:
            // brand  Id
            conditionForProduct = { brand: new ObjectID(request.payload._id) };
            getBrandsData()
                .then(setBrandsData)
                .then(updateDataToElastic)
                .then(data => {
                    return reply({ message: request.i18n.__('genericErrMsg')['200'] }).code(200);
                }).catch(e => {

                    return reply({ message: e }).code(500);
                });
            break;
        case 5:
            // manufacturer Id
            conditionForProduct = { manufacturer: request.payload._id };
            getManufacturerData()
                .then(setManufacturerData)
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
