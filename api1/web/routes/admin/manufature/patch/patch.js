'use strict'
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');

const ObjectID = require('mongodb').ObjectID;
const async = require('async');
const errorMsg = require('../../../../../locales');
const manufacturer = require('../../../../../models/manufacturer');
const childProducts = require('../../../../../models/childProducts');
const childProductsElastic = require('../../../../../models/childProductsElastic');
const products = require('../../../../../models/products');
const productElastic = require('../../../../../models/productElastic');
const validator = Joi.object({
    _id: Joi.string().required().description('id is required')
    // name : Joi.any().allow().description('Updated name'),
    // bannerImage : Joi.string().description('Brand image link'),
    // logoImage : Joi.string().description('Logo image link'),


}).required();

const handler = (request, reply) => {
    const dbErrResponse = request.i18n.__('genericErrMsg')['500'];
    let manufacturerData = {};
    let manufacturerId = request.payload._id;


    // Get brand details 
    const getManufactureDetails = () => {
        return new Promise((resolve, reject) => {

            var condition = {
                _id: new ObjectID(manufacturerId)
            };
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
    // update brand in child products
    const updateManufatureToChildproducts = () => {
        return new Promise((resolve, reject) => {

            var params = {
                query: {
                    "manufacturer": manufacturerId
                },
                data: {
                    $set: {
                        "manufactureName": manufacturerData['name']['en'],
                        "manufacturerName": manufacturerData['name'],
                        "manufactureStatus": manufacturerData['status']

                    }
                }
            };

            childProducts.updateMany(params, (err, result) => {

                if (err) {
                    return reject(dbErrResponse);
                } else {
                    return resolve(true);
                }

            });
        });
    }

    // Delete brand from product

    const updateManufactureToProduct = () => {
        return new Promise((resolve, reject) => {

            var condition = {
                q: {
                    "manufacturer": manufacturerId
                },
                data: {
                    $set: {
                        "manufactureName": manufacturerData['name']['en'],
                        "manufacturerName": manufacturerData['name'],
                        "manufactureStatus": manufacturerData['status']
                    }

                }
            }



            products.update(condition, (err, result) => {
                if (err) {
                    return reject(dbErrResponse);
                } else {
                    return resolve(true);
                }

            });

        });
    }

    // Delete brand from child product elastic
    const updateChildProductDataToElastic = () => {
        return new Promise((resolve, reject) => {

            let updObj = {};
            let conditionForProductBrand = { "manufacturer": manufacturerId }
            childProducts.readAll(conditionForProductBrand, (err, result) => {

                if (err) {
                    return reject(dbErrResponse);
                } else {
                    async.each(result, (item, callback) => {
                        updObj = Object.assign({}, item);
                        updObj.storeId = String(updObj.storeId);

                        item._id = item._id.toString();
                        delete updObj._id;
                        childProductsElastic.Update(item._id, updObj, (err, resultelastic) => {
                            if (err) {

                                callback('err');
                            } else
                                callback();
                        })
                    }, function (err) {
                        if (err) {


                            return reject(dbErrResponse);
                        } else {
                            return resolve(true);
                        }

                    });
                }
            });

        });
    }


    // Delete brand from product elastic 
    const updateProductDataToElastic = () => {
        return new Promise((resolve, reject) => {

            let updObj = {};
            let conditionForProductBrand = { "manufacturer": manufacturerId }
            products.readAll(conditionForProductBrand, (err, result) => {

                if (err) {
                    return reject(dbErrResponse);
                } else {
                    async.each(result, (item, callback) => {
                        updObj = Object.assign({}, item);
                        updObj.storeId = String(updObj.storeId);

                        item._id = item._id.toString();
                        delete updObj._id;
                        productElastic.Update(item._id, updObj, (err, resultelastic) => {
                            if (err) {

                                callback('err');
                            } else
                                callback();
                        })
                    }, function (err) {
                        if (err) {


                            return reject(dbErrResponse);
                        } else {
                            return resolve(true);
                        }

                    });
                }
            });

        });
    }


    getManufactureDetails()
        .then(updateManufatureToChildproducts)
        .then(updateChildProductDataToElastic)
        .then(updateManufactureToProduct)
        .then(updateProductDataToElastic)
        .then(data => {
            return reply({
                message: request.i18n.__('genericErrMsg')['200']
            }).code(200);
        }).catch(e => {

            return reply({
                message: e
            }).code(500);
        });



}
module.exports = {
    handler,
    validator
}