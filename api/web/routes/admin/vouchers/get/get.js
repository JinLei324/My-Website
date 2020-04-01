'use strict'

var vouchers = require('../../../../../models/vouchers');
var chilsProductsElastic = require('../../../../../models/childProductsElastic');
const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;
const Async = require('async');

const handler = (request, reply) => {

    // if(request.params.storeId == 0){
    //     params = {};
    // }else{
    //     params = { "_id": new ObjectID(request.params.storeId) }
    // }

    vouchers.read({}, (err, result) => {
        if (err) return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);

        if (result.length > 0) {
            return reply({ message: request.i18n.__('genericErrMsg')['200'], data: result }).code(200);
        } else {
            return reply({ message: request.i18n.__('getProfile')['404'] }).code(404);
        } 
    })
}

const validator = {
    //  storeId: Joi.string().description('storeId')
}

module.exports = { handler, validator }