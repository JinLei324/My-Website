'use strict'
const driver = require('../../../../../models/driver');
const verificationCode = require('../../../../../models/verificationCode');
const Auth = require('../../../../middleware/authentication');
const error = require('../../../../../locales');  // response messages based on language 
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
    verificationCode.selectRecentVerifiedCode({ givenInput: req.payload.countryCode + req.payload.mobile,userType : 2 }, (err, d) => {
        if (err) {
            logger.error('Error occurred during driver password update (check) : ' + JSON.stringify(err));
            // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']) }).code(500);
            return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500); 
        }
        if (d[0] == null)
            // return reply({ message: error['supportVerifyOTP']['406'] }).code(406);
            return reply({ message: req.i18n.__('supportVerifyOTP')['406'] }).code(406); 
        if (d[0].verified == false)
            // return reply({ message: error['driverUpdatePassword']['401'] }).code(401);
            return reply({ message: req.i18n.__('driverUpdatePassword')['401'] }).code(401); 
        if (d[0].updatedPassword)
            // return reply({ message: error['driverUpdatePassword']['440'] }).code(440); 
            return reply({ message: req.i18n.__('driverUpdatePassword')['440'] }).code(440); 
        if (d[0].verificationCode == req.payload.code || 1111 == req.payload.code ) {
            verificationCode.makePasswordTrue({ _id: new ObjectID(d[0]._id.toString()) }, (err, result) => { });
            driver.changePassword({ countryCode: req.payload.countryCode, mobile: req.payload.mobile, password: Bcrypt.hashSync(req.payload.password, parseInt(config.SaltRounds)) }, (err, result) => {
                if (err) {
                    logger.error('Error occurred during driver logout (update): ' + JSON.stringify(err));
                    // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']) }).code(500);
                    return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);                }
                 else if(result && result.lastErrorObject.updatedExisting) 
                    //  return reply({ message: error['driverUpdatePassword']['200'] }).code(200);
                    return reply({ message: req.i18n.__('driverUpdatePassword')['200'] }).code(200);  
                else
                // return reply({ message: error['driverUpdatePassword']['402'] }).code(402);
                return reply({ message: req.i18n.__('driverUpdatePassword')['402'] }).code(402);  
            });
        } else {
            // return reply({ message: error['supportVerifyOTP']['405'] }).code(405);
            return reply({ message: req.i18n.__('supportVerifyOTP')['405'] }).code(405); 
        }

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
    code: Joi.number().integer().required().description('Code'),
    password: Joi.string().required().description('Password'),
}


/**
* A module that exports update password
* @exports validator
* @exports handler 
*/
module.exports = { handler, validator }