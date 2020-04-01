'use strict'

var products = require('../../../../../models/products');
var productsElastic = require('../../../../../models/productElastic');
const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;
const Async = require('async');

/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (request, reply) => {

    let productId = new ObjectID(request.params.productId);

    products.update({ q: { "_id": productId }, data: { status: 2 } }, (err, updateObj) => {

        if (err) return reply({ message: request.i18n.__('genericErrMsg')['500'], data: err }).code(500);


        // productsElastic.Update(productId.toString(), { status: 2 }, (err, resultelastic) => {


        //     if (err){
        //         logger.error('Error occurred during product remove   (Update): ' + JSON.stringify(err));
        //         return reply({ message: request.i18n.__('genericErrMsg')['500'], data: err }).code(500);
        //     }

        //     return reply({ message: request.i18n.__('products')['200'], data: resultelastic }).code(200);
        // })
        return reply({ message: request.i18n.__('products')['200'], data: [] }).code(200);

        // return reply({ message: error['products']['200'], data: updateObj }).code(200);
    });

    // products.deleteItem({ "_id": productId }, (err, result) => {


    //     if (err) return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']),  data:err }).code(500);

    //        productsElastic.Delete({ "_id" : request.params.productId }, (err, resultelastic) => {
    //                   if (err) return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']), data:err }).code(500);

    //                   return reply({ message: error['products']['200'], data :resultelastic } ).code(200);
    //          })

    //    //return reply({ message: error['products']['200'], data: result }).code(200);

    // });

}

const validator = {

    productId: Joi.string().required().description('productId')
}

module.exports = { handler, validator }