/** @global */
const headerValidator = require('../../../middleware/validator');
/** @namespace */
const validateAddress = require('./get'); 
/** @namespace */
const error = require('../../../../statusMessages/responseMessage');
/** @global */
const Joi = require('joi');
/**
* A module that exports business API  routes to hapi server!
* @exports BUSINESS-FARE-API-ROUTES 
*/
module.exports = [].concat( 
    validateAddress
)