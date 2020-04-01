'use strict'
const zones = require('../../../../../models/zones');
const stores = require('../../../../../models/stores');
const googleDistance = require('../../../../commonModels/googleApi');
const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const async = require('async');
const distance = require('google-distance');
const ObjectID = require('mongodb').ObjectID;

/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    customerId: Joi.string().required().min(24).max(24).description('address line 1'),
    status: Joi.number().integer().min(1).max(2).required().description('1- check price,2 - check delivery type'),
    type: Joi.number().required().description('1- pickup,2 -   delivery  3 - both'),
    latitude: Joi.number().required().description('Latitude'),
    longitude: Joi.number().required().description('Longitude'),
    pickUpLat: Joi.number().allow("").description('Longitude'),
    pickUpLong: Joi.number().allow("").description('Longitude'),
    // store: Joi.array().items().required().description('Store Id if delivery fare [{"storeId":"5a0ed15585985b60fa3aa8e9","storePrice":"12"}] else [{"storeId":"5a0ed15585985b60fa3aa8e9" }] ')
}
/**
* A module that exports customer send otp handler, send otp validator!
* @exports validator 
*/
module.exports = { validator }