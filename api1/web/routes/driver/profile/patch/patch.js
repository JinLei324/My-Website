'use strict'
const driver = require('../../../../../models/driver');
const mobileDevices = require('../../../../../models/mobileDevices');
const verificationCode = require('../../../../../models/verificationCode');
const error = require('../../../../../locales');  // response messages based on language 
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
/** 
* @function
* @name loginHandler 
* @return {object} Reply to the user.
*/
const handler = (req, reply) => { //Action

    var condition = [];

    if (typeof req.payload.email != 'undefined')
        condition.push({ email: req.payload.email });

    if (typeof req.payload.mobile != 'undefined')
        condition.push({ countryCode :req.payload.countryCode,  mobile: req.payload.mobile }); 
    async.series(
        [
            (callback) => {
                if (condition.length === 0)
                    return callback(null, 'done');
                    driver.isExistsOrCondition(condition, (err, doc) => {
                    if (err) {
                        logger.error('Error occurred during driver profile patch (isExistsOrCondition): ' + JSON.stringify(err));
                        // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']) }).code(500);
                        return reply({ message: req.i18n.__('genericErrMsg')['500']  }).code(500);
                    }
                    if (doc === null)
                        return callback(null, 'done');
                        // switch (doc.status) {
                        //     case 1:
                        //         return reply({ message: error['newAccount']['406'] }).code(406);
                        //         break;
                        //     case 6:
                        //         return reply({ message: error['rejectedAccount']['406'] }).code(406);
                        //         break;
                        //     case 7:
                        //         return reply({ message: error['bannedAccount']['406'] }).code(406);
                        //         break;
                        // }
                    if (typeof doc.email != 'undefined' && req.payload.email != 'undefined' && req.payload.email === doc.email)
                        // return reply({ message: error['slaveEmailValidation']['412'] }).code(412);
                        return reply({ message: req.i18n.__('slaveEmailValidation')['412']  }).code(412);
                    if (typeof doc.mobile != 'undefined' && req.payload.mobile != 'undefined' && req.payload.mobile === doc.mobile)
                        // return reply({ message: error['slaveEmailValidation']['413'] }).code(413);
                        return reply({ message: req.i18n.__('slaveEmailValidation')['413']  }).code(413);
                })
            }, //check if the email & phone are already registered

            (callback) => {

                var dataToUpdate = {};

                if (typeof req.payload.email != 'undefined')
                    dataToUpdate.email = req.payload.email;

                if (typeof req.payload.mobile != 'undefined')
                    dataToUpdate.mobile = req.payload.mobile;
                    
                    if (typeof req.payload.countryCode != 'undefined')
                    dataToUpdate.countryCode = req.payload.countryCode;

                if (typeof req.payload.password != 'undefined')
                    dataToUpdate.password = Bcrypt.hashSync(req.payload.password, parseInt(config.SaltRounds));//hash the password and store in db

                if (typeof req.payload.name != 'undefined') {
                    var name = req.payload.name.split(/[ ]+/);
                    dataToUpdate.firstName = name[0];
                    dataToUpdate.lastName = name[1] || '';
                }

                if (typeof req.payload.profilePic != 'undefined')
                    dataToUpdate.profilePic = req.payload.profilePic;

                if (Object.keys(dataToUpdate).length === 0)
                    // return reply({ message: error['patchProfile']['400'] }).code(400)
                    return reply({ message: req.i18n.__('patchProfile')['400']  }).code(400);
                // var updateQuery = {
                //     query: { _id: new ObjectID(req.auth.credentials._id) },
                //     data: { $set: dataToUpdate }
                // };
                dataToUpdate._id = new ObjectID(req.auth.credentials._id)
                logger.info('dataToUpdate '+JSON.stringify(dataToUpdate))
                driver.patchProfile(dataToUpdate, (err, result) => {
                    if (err) {
                        logger.error('Error occurred during driver profile patch (patchProfile): ' + JSON.stringify(err));
                        // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']) }).code(500);
                        return reply({ message: req.i18n.__('genericErrMsg')['500']  }).code(500);
                    }
                    return callback(null, 'done');
                });
            }//update the new details
        ],
        (err, data) => {
            if (err)
                return reply(err);
            // return reply({ message: error['patchProfile']['200'] }).code(200)
            return reply({ message: req.i18n.__('patchProfile')['200']  }).code(200);
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
    mobile: Joi.any().description('mobile'),
    countryCode: Joi.any().description('countryCode'),
    email: Joi.any().description('email'),
    name: Joi.any().description('name'),
    profilePic: Joi.any().description('profile'),
}



/**
* A module that exports driver update profile handler, validator!
* @exports validator
* @exports handler 
*/
module.exports = { handler, validator }