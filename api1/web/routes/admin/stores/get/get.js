'use strict'

var stores = require('../../../../../models/stores');
var storesElastic = require('../../../../../models/storeElastic');
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

    stores.get({}, (err, result) => {

        if (err) return reply({ message:  request.i18n.__('genericErrMsg')['500'] }).code(500);


        //   storesElastic.SelectAll((err, resultelastic) => {
        //               if (err) return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[0], data:err }).code(500);
        //             //  return reply({ message: error['store']['200'][0], data :resultelastic } ).code(200);
        //      })

        return reply({ message:  request.i18n.__('store')['200'], data: result }).code(200);
    })
}

const validator = {
    //  storeId: Joi.string().description('storeId')
}

module.exports = { handler, validator }