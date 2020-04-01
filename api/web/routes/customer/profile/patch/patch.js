'use strict'
const customer = require('../../../../../models/customer');
const mobileDevices = require('../../../../../models/mobileDevices');
const verificationCode = require('../../../../../models/verificationCode');
const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const Bcrypt = require('bcrypt');//hashing module 
const Joi = require('joi');
const async = require('async');
const ObjectID = require('mongodb').ObjectID;
const moment = require('moment');
const logger = require('winston');
const jwt = require('jsonwebtoken');
const sendMsg = require('../../../../../library/twilio')
const sendMail = require('../../../../../library/mailgun')
const cheerio = require('cheerio');//to extract the html from html files
const fs = require('fs');
const Message = require('../../../../../statusMessages/statusMessages');
/** salesforce
* @library 
* @author Umesh Beti
*/
const superagent = require('superagent');
const sf = require('../../../../../library/salesforce');
/*salesforce*/
/** 
* @function
* @name loginHandler 
* @return {object} Reply to the user.
*/
const handler = (req, reply) => { //Action
    logger.error(req.payload)
    // req.headers.language ='en';
    var condition = [];

    if (typeof req.payload.email != 'undefined')
        condition.push({ email: req.payload.email });

    if (typeof req.payload.mobile != 'undefined')
        condition.push({ countryCode: req.payload.countryCode, phone: req.payload.mobile });

    async.series(
        [
            (callback) => {
                if (condition.length === 0)
                    return callback(null, 'done');
                customer.isExistsOrCondition(condition, (err, doc) => {
                    if (err) {
                        logger.error('Error occurred during customer profile patch (isExistsOrCondition): ' + JSON.stringify(err));
                        // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[req.headers.language] }).code(500);
                        return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);
                    }
                    if (doc === null)
                        return callback(null, 'done');

                    if (typeof doc.email != 'undefined' && req.payload.email != 'undefined' && req.payload.email === doc.email)
                        // return reply({ message: error['slaveEmailValidation']['413'][req.headers.language] }).code(413);
                        return reply({ message: req.i18n.__('slaveEmailValidation')['413'] }).code(413);
                    if (typeof doc.phone != 'undefined' && req.payload.mobile != 'undefined' && req.payload.mobile === doc.phone)
                        // return reply({ message: error['slavePhoneValidation']['412'][req.headers.language] }).code(412);
                        return reply({ message: req.i18n.__('slavePhoneValidation')['412'] }).code(412);
                })
            }, //check if the email & phone are already registered

            (callback) => {

                var dataToUpdate = {};

                if (typeof req.payload.email != 'undefined')
                    dataToUpdate.email = req.payload.email;

                if (typeof req.payload.mobile != 'undefined')
                    dataToUpdate.phone = req.payload.mobile;

                if (typeof req.payload.password != 'undefined')
                    dataToUpdate.password = Bcrypt.hashSync(req.payload.password, parseInt(config.SaltRounds));//hash the password and store in db

                if (typeof req.payload.name != 'undefined') {
                    dataToUpdate.name = req.payload.name;
                }

                if (typeof req.payload.profilePic != 'undefined')
                    dataToUpdate.profilePic = req.payload.profilePic;
                if (typeof req.payload.identityCard != 'undefined')
                    dataToUpdate.identityCard = { url: req.payload.identityCard, verified: false };
                // dataToUpdate.status = 2;
                if (typeof req.payload.mmjCard != 'undefined')
                    dataToUpdate.mmjCard = { url: req.payload.mmjCard, verified: false };
                // dataToUpdate.status = 2;
                if (Object.keys(dataToUpdate).length === 0)
                    // return reply({ message: error['patchProfile']['400'][req.headers.language] }).code(400)
                    return reply({ message: req.i18n.__('patchProfile')['400'] }).code(400);

                dataToUpdate._id = new ObjectID(req.auth.credentials._id)
                customer.patchProfile(dataToUpdate, (err, result) => {
                    if (err) {
                        logger.error('Error occurred during customer profile patch (patchProfile): ' + JSON.stringify(err));
                        // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[req.headers.language] }).code(500);
                        return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);
                    }
                    return callback(null, 'done');
                });
            }//update the new details
        ],
        (err, data) => {
            if (err) {
                logger.error('Error occurred during customer profile patch (callback): ' + JSON.stringify(err));
                return reply(err);
            }
            /** salesforce
            * @library 
            * @author Umesh Beti
            */
            var authData = sf.get();
            var DataToSF =
            {
                "mongoId": req.auth.credentials._id,
                "picURL": req.payload.profilePic ? req.payload.profilePic : "",
                "password": req.payload.password ? req.payload.password : "",
                "phone": req.payload.mobile ? req.payload.mobile : "",
                "email": req.payload.email ? req.payload.email : "",
                "countryCode": req.payload.countryCode ? req.payload.countryCode : "",
                "name": req.payload.name ? req.payload.name : ""

            }

            if (authData) {
                superagent
                    .patch(authData.instanceUrl + '/services/apexrest/delivx/Contact')
                    .send(DataToSF) // sends a JSON post body
                    .set('Accept', 'application/json')
                    .set('Authorization', 'Bearer ' + authData.accessToken)
                    .end((err, res) => {

                        if (res) {

                        }
                        if (err) {
                            sf.login(() => {
                                var authData = sf.get();
                                if (authData) {
                                    superagent
                                        .patch(authData.instanceUrl + '/services/apexrest/delivx/Contact')
                                        .send(DataToSF) // sends a JSON post body
                                        .set('Accept', 'application/json')
                                        .set('Authorization', 'Bearer ' + authData.accessToken)
                                        .end((err, res) => {

                                            if (res) {

                                            }
                                        });
                                }
                            });

                        }
                        else {

                        }
                    });
            }

            /*Salesforce */
            // return reply({ message: error['patchProfile']['200'][req.headers.language] }).code(200)
            return reply({ message: req.i18n.__('patchProfile')['200'] }).code(200);
        });
}
/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    password: Joi.any().description('password'),
    countryCode: Joi.any().description('mobile'),
    mobile: Joi.any().description('mobile'),
    email: Joi.any().description('email'),
    profilePic: Joi.any().description('profile'),
    name: Joi.any().description('profile'),
    identityCard: Joi.string().description('Identity Card').allow(""),
    mmjCard: Joi.string().description('MMJ Card').allow("")
}



/**
* A module that exports customer update profile handler, validator!
* @exports validator
* @exports handler 
*/
module.exports = { handler, validator }