'use strict'
const config = process.env;
const Bcrypt = require('bcrypt');//hashing module 
const Joi = require('joi');
const async = require('async');
const moment = require('moment');
const logger = require('winston');
const products = require('../../../models/products');
// const stores_ES = require('../stores_ES');
const ObjectID = require('mongodb').ObjectID;


const handler = (request, reply) => {
    let paramsData={};
    paramsData.productName = request.params.productName;
    paramsData.storeCategoryId = request.params.storeCategoryId;
    paramsData.categoryId = request.params.categoryId;

    products.GetProducts(paramsData, (err, result) => {
        if (err) {
            logger.error(err);
            return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
        }
        if(result.length > 0){
            for (let index = 0; index < result.length; index++) {

                result[index].productName = result[index].pName[request.headers.language];
                delete result[index].pName;
            }
        }

        return reply({ message: request.i18n.__('genericErrMsg')['200'], data: result }).code(200);

    });
};


const validator = {
    productName: Joi.string().required().error(new Error('productName required')).description('productName'),
    categoryId: Joi.string().required().description("ex : 5a281337005a4e3b65bf12a8").example("5a281337005a4e3b65bf12a8").max(24).min(24).error(new Error('category Id is missing or incorrect it must be 24 char || digit only')),
    storeCategoryId: Joi.string().required().description("ex : 5a281337005a4e3b65bf12a8").example("5a281337005a4e3b65bf12a8").max(24).min(24).error(new Error('store category Id is missing or incorrect it must be 24 char || digit only')),
    
}

module.exports = { handler, validator }