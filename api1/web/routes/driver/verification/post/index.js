/** @global */
const Joi = require('joi')
/** @namespace */
const sendOtp = require('./send');
/** @namespace */
const verifyOtp = require('./verify');
/** @global */
const headerValidator = require('../../../../middleware/validator');
/** @namespace */
const error = require('../../../../../locales'); 
/**
* A module that exports Customer API  routes to hapi server!
* @exports CUSTOMER-VERIFICATIONCODE-API-ROUTES 
*/
module.exports = [].concat(sendOtp, verifyOtp);