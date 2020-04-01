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
}).required();

const handler = (request, reply) => {
    const dbErrResponse = request.i18n.__('genericErrMsg')['500'];
    let brandData = {};
    let brandId = request.payload._id;

    // delete brand
    const deleteBrand = () => {
        return new Promise((resolve, reject) => {

            var condition = {
                query: {
                    "_id": new ObjectId(brandId)
                },
                data: {
                    $set: {
                        "status": firstCategoryData['status']
                    }
                }
            };


            brands.update(condition, (err, result) => {
                if (err) {
                    return reject(dbErrResponse);
                } else {
                    return resolve(true);
                }

            });
        });
    }

    // delete brand from child product
    const deleteFromChildProduct = () => {
        return new Promise((resolve, reject) => {

            var params = {
                q: {
                    "brand": new ObjectId(brandId)
                },
                data: {
                    $set: {
                        "brandStatus": 2 //Deleted
                    }
                }
            };


            childProducts.updateMany(condition, (err, result) => {
                if (err) {
                    return reject(dbErrResponse);
                } else {
                    return resolve(true);
                }

            });
        });
    }

    // Delete brand from product

    const deleteFromProduct = () => {
        return new Promise((resolve, reject) => {

            var condition = {
                q: {
                    "brand": new ObjectId(brandId)
                },
                data: {
                    $set: {
                        "brandStatus": firstCategoryData['status']
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

    

    // Delete brand from product elastic 
    


    deleteBrand()
        .then(deleteFromChildProduct)
        .then(deleteFromProduct)
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