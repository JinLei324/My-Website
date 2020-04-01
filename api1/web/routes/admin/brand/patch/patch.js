'use strict'
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');

const ObjectID = require('mongodb').ObjectID;
const async = require('async');
const errorMsg = require('../../../../../locales');
const brands = require('../../../../../models/brands');
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
    let brandData = {};
    let brandId = request.payload._id;


    // Get brand details 
    const getBrandDetails = () => {
        return new Promise((resolve, reject) => {

            var condition = {
                _id: new ObjectID(request.payload._id)
            };
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
    // update brand in child products
    const updateBrandInChildProduct = () => {
        return new Promise((resolve, reject) => {

            var params = {
                query: {
                    "brand": new ObjectID(brandId)
                },
                data: {
                    $set: {
                        "brandName": brandData['name']['en'],
                        "brandStatus": brandData['status'],
                        "brandTitle": brandData['name']
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

    const updateBrandinProduct = () => {
        return new Promise((resolve, reject) => {

            var condition = {
                q: {
                    "brand": brandId
                },
                data: {
                    $set: {
                        "brandName": brandData['name']['en'],
                        "brandTitle": brandData['name']['en'],
                        "brandStatus": brandData['status']

                    }
                }
            };


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
            let conditionForProductBrand = { "brand": new ObjectID(brandId) }
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
            let conditionForProductBrand = { "brand": new ObjectID(brandId) }
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


    getBrandDetails()
        .then(updateBrandInChildProduct)
        .then(updateChildProductDataToElastic)
        .then(updateBrandinProduct)
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