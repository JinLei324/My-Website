'use strict'
const verificationCode = require('../../../../../../models/verificationCode');
const appConfig = require('../../../../../../models/appConfig');
const error = require('../../../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const Joi = require('joi');
const moment = require('moment');
const logger = require('winston');
const Message = require('../../../../../../statusMessages/statusMessages');
const sendMsg = require('../../../../../../library/twilio');
const rabbitMq = require('../../../../../../library/rabbitMq');

const sendSms = require('../../../../../../library/twilio');
/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (request, reply) => {
    var countryCode = request.payload.countryCode;
    var phoneNumber = request.payload.mobile;
    var randomnumber = (config.twilioService == "true") ? Math.floor(100000 + Math.random() * 900000) : 111111;
    var condition = { givenInput: countryCode + phoneNumber, userType: 1, triggeredBy: "Customer New Registration" };
    verificationCode.count(condition, (err, result) => {
        if (err) {
            logger.error('Error occurred during customer send otp(count): ' + JSON.stringify(err));
            // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
            return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
        }
        appConfig.get({}, (err, appConfig) => {
            if (err) {
                logger.error('Error occurred during customer send otp(appconfig get): ' + JSON.stringify(err));
                // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
                return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
            }
            let maxAttemptOtp = 5;
            let otpExpiryTime = 300;

            if (appConfig) {

                maxAttemptOtp = appConfig.forgotPasswordSettings ? parseInt(appConfig.forgotPasswordSettings.maxAttemptOtp) : maxAttemptOtp;
                otpExpiryTime = appConfig.forgotPasswordSettings ? parseInt(appConfig.forgotPasswordSettings.otpExpiryTime) : otpExpiryTime;
            }
            if (result < maxAttemptOtp || result === null) {
                verificationCode.markStatusFalse({ givenInput: countryCode + phoneNumber, userType: 1, triggeredBy: "Customer New Registration" }, (err, result) => {
                    if (err) {
                        logger.error('Error occurred during customer send otp(markStatusFalse): ' + JSON.stringify(err));
                        // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
                        return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                    }
                    verificationCode.saveVerificationCodeMobile({ givenInput: countryCode + phoneNumber, randomnumber: randomnumber, userType: 1, otpExpiryTime: otpExpiryTime, triggeredBy: 'Customer New Registration' }, (err, result) => {
                        if (err) {
                            logger.error('Error occurred during customer send otp(saveVerificationCodeMobile): ' + JSON.stringify(err));
                            // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
                            return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                        }
                        let params = {
                            countryCode: countryCode,
                            phoneNumber: phoneNumber,
                            body: request.i18n.__(request.i18n.__('SMS')['200'], config.appName, randomnumber),
                            // body: request.i18n.__(request.i18n.__('SMS')['200'], config.appName, randomnumber)
                            trigger: 'Customer New Registration'
                        }
			logger.error('executing send otp flow BEFORE twilio block with boolean as '+ config.twilioService + ',with config as '+JSON.stringify(params));

                        if (config.twilioService == "true") {
                            rabbitMq.sendToQueue(rabbitMq.queueSms, params, (err, doc) => {
				if (err) {
                        		logger.error('Error occurred during customer send otp(markStatusFalse): ' + JSON.stringify(err));
                        		// return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
                        		return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                    		}
				logger.error('send message to rabbitmq succesfully' + JSON.stringify(doc));
                            });
                        }
			logger.error('executing send otp flow AFTER twilio block with boolean as ');
                        // reply({ message: error['supportForgotPassword']['200'][request.headers.language] }).code(200);
                        return reply({ message: request.i18n.__('supportForgotPassword')['200'] }).code(200);



                    });

                });
            } else {
                // return reply({ message: error['supportForgotPassword']['429'][request.headers.language] }).code(429);
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
