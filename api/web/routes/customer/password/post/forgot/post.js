'use strict'
const customer = require('../../../../../../models/customer');
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
const TinyURL = require('tinyurl');

const emailLink = "https://superadmin.deliv-x.com/emailComfirm/index.php";
/** 
* @function
* @name loginHandler 
* @return {object} Reply to the user.
*/
const handler = (request, reply) => { //Action
    async.waterfall(
        [
            (callback) => {
                customer.isExistsCountrycode({ email: request.payload.emailOrMobile, countryCode: request.payload.countryCode, phone: request.payload.emailOrMobile }, (err, doc) => {
                    if (err) {
                        logger.error('Error occurred during customer forgot password (isExists): ' + JSON.stringify(err));
                        // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']) }).code(500);
                        return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                    }
                    if (doc === null && request.payload.verifyType == 1)
                        // return reply({ message: error['supportForgotPassword']['406'] }).code(406);
                        return reply({ message: request.i18n.__('supportForgotPassword')['406'] }).code(406);
                    if (doc === null && request.payload.verifyType == 2)
                        // return reply({ message: error['supportForgotPassword']['403'] }).code(403);
                        return reply({ message: request.i18n.__('supportForgotPassword')['403'] }).code(403);
                    if (doc.status == 1) //deactvated
                        // return reply({ message: error['deactivatedAccount']['406'] }).code(406);
                        return reply({ message: request.i18n.__('deactivatedAccount')['406'] }).code(406);
                    if (doc.status == 3) //banned
                        // return reply({ message: error['slaveSignIn']['415'] }).code(415);
                        return reply({ message: request.i18n.__('slaveSignIn')['415'] }).code(415);
                    if (doc.status == 4) //deactvated
                        return reply({ message: request.i18n.__('signIn')['405'] }).code(405);
                    if (doc.mobileVerified == false && (request.payload.verifyType == 1))
                        // return reply({ message: error['slaveSignIn']['402'] }).code(402);
                        return reply({ message: request.i18n.__('slaveSignIn')['402'] }).code(402);
                    return callback(null, doc);
                });
            }
        ],
        (err, data) => {
            if (err) {
                logger.error('Error occurred during customer forgot password : ' + JSON.stringify(err));
                return reply(err);
            }
            verificationCode.countForgotCount({ givenInput: data.countryCode + data.phone, userType: 1, triggeredBy: "Customer Forgot Password Verification Code" }, (err, result) => {
                if (err) {
                    logger.error('Error occurred during customer forgot password (countForgotCount): ' + JSON.stringify(err));
                    // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']) }).code(500);
                    return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                }
                appConfig.get({}, (err, appConfig) => {
                    if (err) {
                        logger.error('Error occurred during customer send otp(appconfig get): ' + JSON.stringify(err));
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
                        verificationCode.markStatusFalse({ givenInput: request.payload.countryCode + request.payload.emailOrPhone, userType: 1, triggeredBy: "Customer Forgot Password Verification Code", }, (err, result) => {
                            if (err) {
                                logger.error('Error occurred during customer forgot password (markStatusFalse): ' + JSON.stringify(err));
                                // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']) }).code(500);
                                return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                            }
                            let randomnumber = (config.twilioService == "true") ? Math.floor(100000 + Math.random() * 900000) : 111111;
                            verificationCode.saveVerificationCodeForgotPassword({
                                userType: 1,
                                givenInput: (request.payload.verifyType == 1) ? (request.payload.countryCode + data.phone) : data.email, randomnumber: randomnumber, otpExpiryTime: otpExpiryTime, verifyType: request.payload.verifyType, userId: new ObjectID(data._id), triggeredBy: 'Customer Forgot Password Verification Code', // 2- forgot password ,1 - registration
                            }, (err, result) => {
                                if (err) {
                                    logger.error('Error occurred during customer forgot password (saveVerificationCodeForgotPassword): ' + JSON.stringify(err));
                                    // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']) }).code(500);
                                    return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                                }
                                switch (request.payload.verifyType) {
                                    case 1:
                                        let params = {
                                            countryCode: request.payload.countryCode,
                                            phoneNumber: data.phone,
                                            body: request.i18n.__(request.i18n.__('SMS')['200'], config.appName, randomnumber),
                                            trigger: 'Customer Forgot Password Verification Code (sms)'
                                        }

                                        if (config.twilioService == "true") {
                                            rabbitMq.sendToQueue(rabbitMq.queueSms, params, (err, doc) => {
                                            });
                                        }
                                        return reply({ message: request.i18n.__('supportForgotPassword')['200'] }).code(200);
                                        // })
                                        break;
                                    case 2:
                                        // let qryData = {
                                        //     query: {
                                        //         email: data.email,
                                        //         status: { "$nin": ['4', 4] }
                                        //     },
                                        //     data: {
                                        //         '$set': {
                                        //             "resetCode": randomnumber
                                        //         }
                                        //     }
                                        // }
                                        // customer.findOneAndUpdate(qryData, (err, result) => {
                                        //     data['resetCode'] = randomnumber;
                                        //     let token = jwt.sign(
                                        //         {
                                        //             id: data._id.toString(),
                                        //             collectionName: 'customer',
                                        //             resetCode: randomnumber
                                        //         },
                                        //         config.Secret,
                                        //         {
                                        //             expiresIn: appConfig.forgotPasswordSettings ? appConfig.forgotPasswordSettings.resetPasswordLinkExpiry : 900,
                                        //             subject: 'resetPassword'
                                        //         }
                                        //     );
                                        //     // let urlLink = config.forgotpasswordLink + "??" + token;
                                        //     let urlLink = emailLink + "??" + token;
                                        //     TinyURL.shorten(urlLink, function (url) {
                                        //         let resetUrl = url;
                                        //         if (config.mailGunService == "true") {
                                        //             console.log("resetUrl", resetUrl)
                                        //             console.log("data._id", data._id)
                                        //             email.getTemplateAndSendEmail({
                                        //                 templateName: 'customerForgotPassword.html',
                                        //                 toEmail: data.email,
                                        //                 subject: 'Action Required. Reset Password.',
                                        //                 trigger: 'Customer Forgot Password Verification Code',
                                        //                 keysToReplace: {
                                        //                     username: data.name.charAt(0).toUpperCase() + data.name.slice(1), url: "<a href=" + resetUrl + " style='color:#12939a' target='_blank'>click here</a>", appName: config.appName,
                                        //                     resetPasswordLinkExpiry: appConfig.forgotPasswordSettings ? String(appConfig.forgotPasswordSettings.resetPasswordLinkExpiry / 60) : String(900 / 60)
                                        //                 }
                                        //             }, () => {
                                        //             });
                                        //         }
                                        //         return reply({ message: request.i18n.__('supportForgotPasswordE')['200'] }).code(200);
                                        //     });
                                        // });
                                        // break;
                                        let token = jwt.sign({ id: result.insertedIds[0].toString(), type: 1 }, config.Secret, { expiresIn: appConfig.forgotPasswordSettings ? appConfig.forgotPasswordSettings.resetPasswordLinkExpiry : 900 });
                                        if (config.mailGunService == "true") {
                                            email.getTemplateAndSendEmail({
                                                templateName: 'customerForgotPassword.html',
                                                toEmail: data.email,
                                                subject: 'Action Required. Reset Password.',
                                                trigger: 'Customer Forgot Password Verification Code',
                                                keysToReplace: {
                                                    username: data.name.charAt(0).toUpperCase() + data.name.slice(1), url: "<a href=" + config.forgotpasswordLinkCustomer + "?" + token + " style='color:#12939a' target='_blank'>click here</a>", appName: config.appName,
                                                    resetPasswordLinkExpiry: appConfig.forgotPasswordSettings ? String(appConfig.forgotPasswordSettings.resetPasswordLinkExpiry / 60) : String(900 / 60)
                                                }
                                            }, () => {
                                            });
                                        }
                                        // return reply({ message: error['supportForgotPasswordE']['200'] }).code(200);
                                        return reply({ message: request.i18n.__('supportForgotPasswordE')['200'] }).code(200);
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
}



/**
* A module that exports customer forgot password handler, validator!
* @exports validator
* @exports handler 
*/
module.exports = { handler, validator }