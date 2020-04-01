'use strict'
const verificationCode = require('../../../../../../models/verificationCode');
const error = require('../../../../../../locales');  // response messages based on language 
const config = process.env;
const Joi = require('joi');
const moment = require('moment');
const logger = require('winston');
const Message = require('../../../../../../statusMessages/statusMessages');
const appConfig = require('../../../../../../models/appConfig');
const sendMsg = require('../../../../../../library/twilio');
const rabbitMq = require('../../../../../../library/rabbitMq');
/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (request, reply) => {

    let countryCode = request.payload.countryCode;
    let phoneNumber = request.payload.mobile;

    let randomnumber = (config.twilioService == "true") ? Math.floor(1000 + Math.random() * 9000) : 1111;
    let condition = { givenInput: countryCode + phoneNumber, triggeredBy: 'Driver New Registration Verification Code', userType: 2 };
    verificationCode.count(condition, (err, result) => {
        if (err) {
            logger.error('Error occurred during driver send otp (count): ' + JSON.stringify(err));
            return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
        }
        appConfig.get({}, (err, appConfig) => {
            if (err) {
                logger.error('Error occurred during driver send otp(appconfig get): ' + JSON.stringify(err));
                return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
            }
            let maxAttemptOtp = 5;
            let otpExpiryTime = 300;
            if (appConfig) {
                maxAttemptOtp = appConfig.forgotPasswordSettings ? parseInt(appConfig.forgotPasswordSettings.maxAttemptOtp) : maxAttemptOtp;
                otpExpiryTime = appConfig.forgotPasswordSettings ? parseInt(appConfig.forgotPasswordSettings.otpExpiryTime) : otpExpiryTime;
            }
            if (result < maxAttemptOtp || result === null) {
                verificationCode.markStatusFalse({ givenInput: countryCode + phoneNumber, triggeredBy: 'Driver New Registration Verification Code', userType: 2 }, (err, result) => {
                    if (err) {
                        logger.error('Error occurred during driver send otp (markStatusFalse): ' + JSON.stringify(err));
                        return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                    }
                    verificationCode.saveVerificationCodeMobile({ givenInput: countryCode + phoneNumber, randomnumber: randomnumber, userType: 2, otpExpiryTime: otpExpiryTime, triggeredBy: 'Driver New Registration Verification Code' }, (err, result) => {
                        if (err) {
                            logger.error('Error occurred during driver send otp (saveVerificationCodeMobile): ' + JSON.stringify(err));
                            return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                        }
                        let params = {
                            countryCode: countryCode,
                            phoneNumber: phoneNumber,
                            body: 'Your ' + config.appName + ' verification code is ' + randomnumber + '',
                            trigger: 'Driver New Registration Verification Code'
                        }
                        if (config.twilioService == "true") {
                            rabbitMq.sendToQueue(rabbitMq.queueSms, params, (err, doc) => {
                            });
                        }
                        reply({ message: request.i18n.__('supportForgotPassword')['200'] }).code(200);
                    });

                });
            } else {
                return reply({ message: request.i18n.__('supportForgotPassword')['429'] }).code(429);
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
    mobile: Joi.string().required().description('Mobile number').error(new Error('Mobile nubmer invalid please enter correct')),
    countryCode: Joi.string().required().description('Country code'),
}


/**
* A module that exports customer send otp handler, send otp validator!
* @exports validator
* @exports handler 
*/
module.exports = { handler, validator }