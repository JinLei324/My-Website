'use strict'
const cart = require('../../../../../models/cart');
const zones = require('../../../../../models/zones');
const childProducts = require('../../../../../models/childProducts');
const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const Joi = require('joi');
const stores = require('../../../../../models/stores');
const logger = require('winston');
const async = require('async');
const distance = require('google-distance');
const ObjectID = require('mongodb').ObjectID;
/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (request, reply) => {
    return reply({ message: request.i18n.__('checkout')['200'] }).code(200);
}

/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    latitude: Joi.number().required().description('Latitude'),
    longitude: Joi.number().required().description('Longitude'),
}

/**
* A module that exports customer get cart handler, get cart validator! 
* @exports handler 
*/
module.exports = { handler, validator }