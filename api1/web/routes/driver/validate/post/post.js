'use strict'
const verificationCode = require('../../../../../models/verificationCode');
const error = require('../../../../../locales');  // response messages based on language 
const config = process.env;
const Joi = require('joi');
const moment = require('moment');
const logger = require('winston');
const Message = require('../../../../../statusMessages/statusMessages');
const sendMsg = require('../../../../../library/twilio');
const driver = require('../../../../../models/driver');
/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (req, reply) => {
    var condition = {};
    switch (parseInt(req.payload.verifyType)) {
        case 1:
            if (typeof req.payload.mobile === 'undefined' || req.payload.mobile == '' || req.payload.mobile == null)
                // return reply({ message: error['postPhoneValidation']['400'] }).code(400);
                return reply({ message: req.i18n.__('postPhoneValidation')['400']  }).code(400);
            condition = { countryCode: req.payload.countryCode, mobile: req.payload.mobile };
            break;//email
        case 2:
            if (typeof req.payload.email === 'undefined' || req.payload.email == '' || req.payload.email == null)
                // return reply({ message: error['postPhoneValidation']['400'] }).code(400);
                return reply({ message: req.i18n.__('postPhoneValidation')['400']  }).code(400);
            condition = { email: req.payload.email };
            break;//mobile
        default:
            // return reply({ message: error['postPhoneValidation']['400'] }).code(400);
            return reply({ message: req.i18n.__('postPhoneValidation')['400']  }).code(400);
    }
    driver.checkWithEmailOrMail(condition, (e, r) => {
        if (e) {
            logger.error('Error occurred during driver email phone validate (checkWithEmailOrMail): ' + JSON.stringify(e));
            // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']) }).code(500);
            return reply({ message: req.i18n.__('genericErrMsg')['500']  }).code(500);
        }
        if (r === null)
            // return reply({ message: error['postPhoneValidation']['200'] }).code(200);
            return reply({ message: req.i18n.__('postPhoneValidation')['200']  }).code(200);
        return (req.payload.verifyType == 1) ? reply({ message: req.i18n.__('postPhoneValidation')['412'] }).code(412) : reply({ message: req.i18n.__('postPhoneValidation')['413'] }).code(413);
    });
}
/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    countryCode: Joi.any().description('Country code'),
    mobile: Joi.string().trim().empty('').description('Mobile number'),
    verifyType: Joi.number().integer().min(1).max(2).description('1- Mobile ,  2- Email'),
    email: Joi.string().trim().empty('').description('Email id')
}


/**
* A module that exports customer email phone handler, validator!
* @exports validator
* @exports handler 
*/
module.exports = { handler, validator }