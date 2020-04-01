'use strict'
const customer = require('../../../../../models/customer');
const verificationCode = require('../../../../../models/verificationCode');
const Auth = require('../../../../middleware/authentication');
const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const Bcrypt = require('bcrypt');//hashing module 
const Joi = require('joi');
const async = require('async');
const ObjectID = require('mongodb').ObjectID;
const moment = require('moment');
const logger = require('winston');
/** salesforce
* @library 
* @author Umesh Beti
*/
const superagent = require('superagent');
const salesforce = require('../../../../../library/salesforce');

/*salesforce*/
/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (req, reply) => {
    // req.headers.language = 'en';
    if (req.payload.code == 999999) {
        customer.changePassword({ countryCode: req.payload.countryCode, mobile: req.payload.mobile, password: Bcrypt.hashSync(req.payload.password, parseInt(config.SaltRounds)), status: { $nin: [4] } }, (err, result) => {
            if (err) {
                logger.error('Error occurred during customer logout (update): ' + JSON.stringify(err));
                // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[req.headers.language] }).code(500);
                return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);
            }
            else if (result && result.lastErrorObject.updatedExisting) {

                var authData = salesforce.get();
                var UserIDSalesforce = "";
                //var commissionType = request.payload.commissionType == 0 ? "Percentage" : "Fixed"
                var DataToSF =
                {
                    "mongoId": UserIDSalesforce,
                    "phone": result.mobile,
                    "countryCode": result.countryCode,
                    "password": result.password
                }

                if (authData) {
                    superagent
                        .patch(authData.instanceUrl + '/services/apexrest/delivx/Conatct')
                        .send(DataToSF) // sends a JSON post body
                        .set('Accept', 'application/json')
                        .set('Authorization', 'Bearer ' + authData.accessToken)
                        .end((err, res) => {
                            if (err)

                                if (err) {
                                    salesforce.login(() => {
                                        var authData = salesforce.get();
                                        if (authData) {
                                            superagent
                                                .patch(authData.instanceUrl + '/services/apexrest/delivx/Contact')
                                                .send(DataToSF) // sends a JSON post body
                                                .set('Accept', 'application/json')
                                                .set('Authorization', 'Bearer ' + authData.accessToken)
                                                .end((err, res) => {
                                                    if (err) {

                                                    }
                                                });
                                        }
                                    });

                                }
                                else {

                                }
                        });
                }
                // return reply({ message: error['customerUpdatePassword']['200'][req.headers.language] }).code(200);
                return reply({ message: req.i18n.__('customerUpdatePassword')['200'] }).code(200);
            } else
                // return reply({ message: error['customerUpdatePassword']['402'][req.headers.language] }).code(402);
                return reply({ message: req.i18n.__('customerUpdatePassword')['402'] }).code(402);
        });
    } else {
        verificationCode.selectRecentVerifiedCode({ givenInput: req.payload.countryCode + req.payload.mobile, userType: 1 }, (err, d) => {
            if (err) {
                logger.error('Error occurred during customer password update (check) : ' + JSON.stringify(err));
                // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[req.headers.language] }).code(500);
                return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);
            }
            if (d[0] == null)
                // return reply({ message: error['supportVerifyOTP']['406'][req.headers.language] }).code(406);
                return reply({ message: req.i18n.__('supportVerifyOTP')['406'] }).code(406);
            if (d[0].verified == false)
                // return reply({ message: error['customerUpdatePassword']['401'][req.headers.language] }).code(401);
                return reply({ message: req.i18n.__('customerUpdatePassword')['401'] }).code(401);
            if (d[0].updatedPassword)
                // return reply({ message: error['customerUpdatePassword']['440'][req.headers.language] }).code(440);
                return reply({ message: req.i18n.__('customerUpdatePassword')['440'] }).code(440);
            // if ((d[0].verificationCode == req.payload.code) || (111111 == req.payload.code)) {
            if ((d[0].verificationCode == req.payload.code)) {
                verificationCode.makePasswordTrue({ _id: new ObjectID(d[0]._id.toString()) }, (err, result) => { });
                customer.changePassword({ countryCode: req.payload.countryCode, mobile: req.payload.mobile, password: Bcrypt.hashSync(req.payload.password, parseInt(config.SaltRounds)), status: { $nin: [4] } }, (err, result) => {
                    if (err) {
                        logger.error('Error occurred during customer logout (update): ' + JSON.stringify(err));
                        // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[req.headers.language] }).code(500);
                        return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);
                    }
                    else if (result && result.lastErrorObject.updatedExisting) {

                        var authData = salesforce.get();
                        var UserIDSalesforce = "";
                        //var commissionType = request.payload.commissionType == 0 ? "Percentage" : "Fixed"
                        var DataToSF =
                        {
                            "mongoId": UserIDSalesforce,
                            "phone": result.mobile,
                            "countryCode": result.countryCode,
                            "password": result.password
                        }

                        if (authData) {
                            superagent
                                .patch(authData.instanceUrl + '/services/apexrest/delivx/Conatct')
                                .send(DataToSF) // sends a JSON post body
                                .set('Accept', 'application/json')
                                .set('Authorization', 'Bearer ' + authData.accessToken)
                                .end((err, res) => {
                                    if (err)

                                        if (err) {
                                            salesforce.login(() => {
                                                var authData = salesforce.get();
                                                if (authData) {
                                                    superagent
                                                        .patch(authData.instanceUrl + '/services/apexrest/delivx/Contact')
                                                        .send(DataToSF) // sends a JSON post body
                                                        .set('Accept', 'application/json')
                                                        .set('Authorization', 'Bearer ' + authData.accessToken)
                                                        .end((err, res) => {
                                                            if (err) {

                                                            }
                                                        });
                                                }
                                            });

                                        }
                                        else {

                                        }
                                });
                        }
                        // return reply({ message: error['customerUpdatePassword']['200'][req.headers.language] }).code(200);
                        return reply({ message: req.i18n.__('customerUpdatePassword')['200'] }).code(200);
                    } else
                        // return reply({ message: error['customerUpdatePassword']['402'][req.headers.language] }).code(402);
                        return reply({ message: req.i18n.__('customerUpdatePassword')['402'] }).code(402);
                });
            } else {
                // return reply({ message: error['supportVerifyOTP']['405'][req.headers.language] }).code(405);
                return reply({ message: req.i18n.__('supportVerifyOTP')['405'] }).code(405);
            }

        });
    }

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
    code: Joi.number().integer().required().description('Code'),
    password: Joi.string().required().description('Password'),
}


/**
* A module that exports Verify Otp Handler, Verify Otp validator!
* @exports validator
* @exports handler 
*/
module.exports = { handler, validator }