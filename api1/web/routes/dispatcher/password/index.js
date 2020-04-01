/** @global */
const Joi = require('joi') 
/** @global */
const headerValidator = require('../../../middleware/validator');
/** @namespace */
const i18n = require('../../../../locales/locales');

/** @namespace */
const post = require('./post'); 
/**
* A module that exports Customer API  routes to hapi server!
* @exports CUSTOMER-EMAIL-PHONE-VALIDATION-API-ROUTES 
*/
module.exports = post;