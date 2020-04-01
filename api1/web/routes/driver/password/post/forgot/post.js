'use strict'
const driver = require('../../../../../../models/driver');
const mobileDevices = require('../../../../../../models/mobileDevices');
const verificationCode = require('../../../../../../models/verificationCode');
const error = require('../../../../../../locales');  // response messages based on language 
const appConfig = require('../../../../../../models/appConfig');
const config = process.env;
const Bcrypt = require('bcrypt');//hashing module 
const Joi = require('joi');
const async = require('async');
const ObjectID = require('mongodb').ObjectID;
const moment = require('moment');
const logger = require('winston');
const jwt = require('jsonwebtoken');
const sendMsg = require('../../../../../../library/twilio')
const sendMail = require('../../../../../../library/mailgun')
const cheerio = require('cheerio');//to extract the html from html files
const fs = require('fs');
const Message = require('../../../../../../statusMessages/statusMessages');
const rabbitMq = require('../../../../../../library/rabbitMq');
const email = require('../../../../../commonModels/email/email');
/** 
* @function
* @name loginHandler 
* @return {object} Reply to the user.
*/
const handler = (request, reply) => { //Action
    async.waterfall(
        [
            (callback) => {
                driver.isExists({ email: request.payload.emailOrMobile, mobile: request.payload.emailOrMobile, countryCode: request.payload.countryCode }, (err, doc) => {
                    if (err) {
                        logger.error('Error occurred during driver forgot password (isExists): ' + JSON.stringify(err));
                        // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']) }).code(500);
                        return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);

                    }
                    if (doc === null && request.payload.verifyType == 1)
                        // return reply({ message: error['supportForgotPassword']['406'] }).code(406);
                        return reply({ message: request.i18n.__('supportForgotPassword')['406'] }).code(406);
                    if (doc === null && request.payload.verifyType == 2)
                        // return reply({ message: error['supportForgotPassword']['403'] }).code(403);
                        return reply({ message: request.i18n.__('supportForgotPassword')['403'] }).code(403);
                    switch (doc.status) {
                        case 1:
                            // return reply({ message: error['newAccount']['406'] }).code(406);
                            return reply({ message: request.i18n.__('newAccount')['406'] }).code(406);
                            break;
                        case 6:
                            // return reply({ message: error['rejectedAccount']['406'] }).code(406);
                            return reply({ message: request.i18n.__('rejectedAccount')['406'] }).code(406);
                            break;
                        case 7:
                            // return reply({ message: error['bannedAccount']['406'] }).code(406);
                            return reply({ message: request.i18n.__('bannedAccount')['406'] }).code(406);
                            break;
                    }
                    return callback(null, doc);
                });
            }
        ],
        (err, data) => {
            if (err)
                return reply(err);
            verificationCode.countForgotCount({ givenInput: data.countryCode + data.mobile, triggeredBy: 'Driver Forgot Password Verification Code', userType: 2 }, (err, result) => {
                if (err) {
                    logger.error('Error occurred during driver forgot password (countForgotCount): ' + JSON.stringify(err));
                    // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']) }).code(500);
                    return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                }
                appConfig.get({}, (err, appConfig) => {
                    if (err) {
                        logger.error('Error occurred during driver send otp(appconfig get): ' + JSON.stringify(err));
                        // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']) }).code(500);
                        return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                    }
                    let maxAttemptForgotPassword = 5;
                    let otpExpiryTime = 300;
                    if (appConfig) {
                        maxAttemptForgotPassword = appConfig.forgotPasswordSettings ? parseInt(appConfig.forgotPasswordSettings.maxAttemptForgotPassword) : maxAttemptForgotPassword;
                        otpExpiryTime = appConfig.forgotPasswordSettings ? parseInt(appConfig.forgotPasswordSettings.otpExpiryTime) : otpExpiryTime;
                    }
                    if (result < maxAttemptForgotPassword || result === null) {
                        verificationCode.markStatusFalse({ givenInput: request.payload.countryCode + request.payload.emailOrPhone, triggeredBy: 'Driver Forgot Password Verification Code', userType: 2 }, (err, result) => {
                            if (err) {
                                logger.error('Error occurred during driver forgot password (markStatusFalse): ' + JSON.stringify(err));
                                // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']) }).code(500);
                                return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                            }
                            let randomnumber = (config.twilioService === "true") ? Math.floor(1000 + Math.random() * 9000) : 1111;
                            verificationCode.saveVerificationCodeForgotPassword({
                                userType: 2,
                                givenInput: (request.payload.verifyType == 1) ? (request.payload.countryCode + data.mobile) : data.email, randomnumber: randomnumber, otpExpiryTime: otpExpiryTime, verifyType: request.payload.verifyType, userId: new ObjectID(data._id), triggeredBy: 'Driver Forgot Password Verification Code' // 2- forgot password ,1 - registration
                            }, (err, result) => {
                                if (err) {
                                    logger.error('Error occurred during driver forgot password (saveVerificationCodeForgotPassword): ' + JSON.stringify(err));
                                    // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']) }).code(500);
                                    return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                                }
                                switch (request.payload.verifyType) {
                                    case 1:
                                        var params = {
                                            countryCode: data.countryCode,
                                            phoneNumber: data.mobile,
                                            body: 'Your ' + config.appName + ' verification code is ' + randomnumber + '',
                                            trigger: 'Driver Forgot Password Verification Code'
                                        }
                                        if (config.twilioService == "true") {
                                            rabbitMq.sendToQueue(rabbitMq.queueSms, params, (err, doc) => {
                                            });
                                        }
                                        // reply({ message: error['supportForgotPassword']['200'] }).code(200);
                                        return reply({ message: request.i18n.__('supportForgotPassword')['200'] }).code(200);
                                        // })
                                        break;
                                    case 2:
                                        let token = jwt.sign({ id: result.insertedIds[0].toString(), type: 1 }, config.Secret, { expiresIn: 900 });
                                        if (config.mailGunService == "true") {
                                            email.getTemplateAndSendEmail({
                                                templateName: 'driverForgotPassword.html',
                                                toEmail: data.email,
                                                subject: 'Action Required. Reset Password.',
                                                trigger: 'Driver Forgot Password Verification Code',
                                                keysToReplace: { appName: config.appName, username: (data.firstName + " " + data.lastName).charAt(0).toUpperCase() + (data.firstName + " " + data.lastName).slice(1), url: "<a href=" + config.forgotpasswordLinkDriver + "?" + token + " style='color:#12939a' target='_blank'>click here</a>" }
                                            }, () => {
                                            });
                                        }
                                        // return reply({ message: error['supportForgotPassword']['202'] }).code(202);
                                        return reply({ message: request.i18n.__('supportForgotPassword')['202'] }).code(202);
                                        break;
                                }
                            });

                        });
                    } else {
                        // return reply({ message: error['supportForgotPassword']['429'] }).code(429);
                        return reply({ message: request.i18n.__('supportForgotPassword')['429'] }).code(429);
                    }
                });
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
    countryCode: Joi.string().description('country Code if mobile').allow(""),
    emailOrMobile: Joi.string().required().description('Email or mobile'),
    verifyType: Joi.number().integer().min(1).max(2).required().description('1- mobile , 2- email')
    // processType: Joi.number().integer().min(1).max(2).required().description('1- Registration , 2- Forgot password').default(2)
}



/**
* A module that exports driver forgot password handler, validator!
* @exports validator
* @exports handler 
*/
module.exports = { handler, validator }