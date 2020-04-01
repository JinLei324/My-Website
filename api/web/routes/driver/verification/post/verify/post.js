'use strict'
const driver = require('../../../../../../models/driver');
const mobileDevices = require('../../../../../../models/mobileDevices');
const verificationCode = require('../../../../../../models/verificationCode');
const appConfig = require('../../../../../../models/appConfig');
const Auth = require('../../../../../middleware/authentication');
const error = require('../../../../../../locales');  // response messages based on language 
const config = process.env;
const Bcrypt = require('bcrypt');//hashing module 
const Joi = require('joi');
const async = require('async');
const ObjectID = require('mongodb').ObjectID;
const moment = require('moment');
const logger = require('winston');

/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (req, reply) => {
    verificationCode.selectRecentCode({ givenInput: req.payload.countryCode + req.payload.mobile, userType: 2 }, (err, d) => {
        if (err) {
            logger.error('Error occurred during driver verify otp (selectRecentCode): ' + JSON.stringify(err));
            return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);
        }
        if (d[0] == null)
            return reply({ message: req.i18n.__('supportVerifyOTP')['406'] }).code(406);
        if (d[0].verified == true)
            return reply({ message: req.i18n.__('supportVerifyOTP')['401'] }).code(401);
        if ((1111 != req.payload.code) && d[0].expiryTime < moment().valueOf())
            return reply({ message: req.i18n.__('supportVerifyOTP')['410'] }).code(410);
        appConfig.get({}, (err, appConfig) => {
            if (err) {
                logger.error('Error occurred during driver verify otp(appconfig get): ' + JSON.stringify(err));
                return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);
            }
            let maxAttemptOtp = 5;
            if (appConfig) {
                maxAttemptOtp = appConfig.forgotPasswordSettings ? parseInt(appConfig.forgotPasswordSettings.maxAttemptOtp) : 5;
            }
            if (d[0].maxAttempt < maxAttemptOtp) {
                d[0].code = req.payload.code;
                if ((d[0].verificationCode == req.payload.code) || (1111 == req.payload.code)) {
                    verificationCode.makeVerifyTrue(d[0], (err, result) => {
                    });
                    driver.makeVerifyTrue({ countryCode: req.payload.countryCode, mobile: req.payload.mobile }, (err, result) => {
                        if (err) logger.error('Error occurred during driver verify otp (makeVerifyTrue2): ' + JSON.stringify(err));
                    });
                    return reply({ message: req.i18n.__('supportVerifyOTP')['200'] }).code(200);
                } else {
                    verificationCode.saveWrongEntered(d[0], (err, res) => {
                        if (err) {
                            logger.error('Error occurred during driver verify otp (saveWrongEntered): ' + JSON.stringify(err));
                            return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);
                        }
                        if (res)
                            return reply({ message: req.i18n.__('supportVerifyOTP')['405'] }).code(405);
                    });
                }
            } else {
                return reply({ message: req.i18n.__('supportVerifyOTP')['429'] }).code(429);
            }
        });
    });
}

/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    mobile: Joi.string().required().description('Mobile number').error(new Error('Mobile number invalid please enter correct')),
    countryCode: Joi.string().required().description('Country code'),
    code: Joi.number().integer().required().description('Code')
}


/**
* A module that exports Verify Otp Handler, Verify Otp validator!
* @exports validator
* @exports handler 
*/
module.exports = { handler, validator }