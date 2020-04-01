/** @global */
const headerValidator = require('../../../middleware/validator');
/** @namespace */
const calculateFare = require('./post');
/** @namespace */
const patch = require('./patch');
/** @namespace */
const error = require('../../../../statusMessages/responseMessage');
/** @global */
const Joi = require('joi');
/**
* A module that exports business API  routes to hapi server!
* @exports BUSINESS-FARE-API-ROUTES 
*/
module.exports = [].concat(
    patch,
    calculateFare
)