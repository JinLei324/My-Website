'use strict'
const customer = require('../../../../../models/customer');
const mobileDevices = require('../../../../../models/mobileDevices');
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
const sendMsg = require('../../../../../library/twilio')
const sendMail = require('../../../../../library/mailgun')
const cheerio = require('cheerio');//to extract the html from html files
const fs = require('fs');
const jwt = require('jsonwebtoken');
const email = require('../../../../commonModels/email/email');

const referralCampaigns = require('../../../../routes/referralCampaigns/post');
let geocodder = require('node-geocoder');
var options = {
    provider: 'google',
    // Optionnal depending of the providers
    httpAdapter: 'https', // Default
    apiKey: config.GoogleMapsApiKEy, // for Mapquest, OpenCage, Google Premier
    formatter: null        // 'gpx', 'string', ...
};
let geo = geocodder(options);


/** 
* @function
* @name handler 
* @return {object} Reply to the user.
* @param {data} 0 - name, 1 - email, 2 - mobile
*/
const handler = (req, reply) => {
    let userId = "";
    let condition = {};
    if (req.payload.customerPOSId == "undefined" || req.payload.customerPOSId == undefined) {
        userId = req.auth.credentials._id;
        condition = { _id: new ObjectID(req.auth.credentials._id), userType: 3 }
    } else {
        userId = req.payload.customerPOSId;
        condition = { customerPOSId: req.payload.customerPOSId }
    }
    let mongoId = new ObjectID();
    let fcmTopic = 'FCM-' + mongoId.toString() + moment().unix();//generate a new fcmTopic on new login
    let mqttTopic = 'MQTT-' + mongoId.toString() + moment().unix();//generate a new mqttTopic on new login
    req.payload.coordinates = { longitude: parseFloat(req.payload.longitude || 0.0), latitude: parseFloat(req.payload.latitude || 0.0) }
    req.payload.fcmTopic = fcmTopic;
    req.payload.mqttTopic = mqttTopic;


    async.series([

        (cb) => {
            customer.count({ email: req.payload.email }, (e, r) => {
                if (e) {
                    logger.error('Error occurred during customer signup (count email): ' + JSON.stringify(e));
                    return reply({ message:req.i18n.__('genericErrMsg')['500']  }).code(500);
                }
                if (r > 0)
                    return reply({ message: req.i18n.__('postSignUp')['412'] }).code(412);
                return cb(null, 'done');
            });
        }, //check if the email is already registered
        (cb) => {
            customer.count({ countryCode: req.payload.countryCode, phone: req.payload.mobile }, (e, r) => {
                if (e) {
                    logger.error('Error occurred during customer signup (count phone): ' + JSON.stringify(e));
                    return reply({ message: req.i18n.__('genericErrMsg')['500']   }).code(500);
                }
                if (r > 0)
                    return reply({ message: req.i18n.__('postSignUp')['413']   }).code(413);
                return cb(null, 'done');
            });
        }, //check if the phone is already registered
        (cb) => {
            let geoip = require('geoip-lite');
            let geoCalcIp = geoip.lookup(req.payload.ipAddress);
            req.payload.registeredFromCity = geoCalcIp ? geoCalcIp.city : "";
            req.payload.ip = {
                address: req.payload.ipAddress ? req.payload.ipAddress : "",
                city: geoCalcIp ? geoCalcIp.city : ""
            };
            try {
                geo.reverse({ lat: req.payload.latitude || 0, lon: req.payload.longitude || 0 }, (err, data) => {
                    if (data && data[0]) {
                        req.payload.registeredFromCity = data[0]['city'] ? data[0]['city'] : ""
                    }
                    return cb(null, 'done');
                });
            } catch (e) {
                return cb(null, 'done');
            }

        }, //check if the phone is already registered
        (cb) => {

            req.payload.id = req.auth.credentials ? req.auth.credentials._id : "5a86debdb5a1dd17f1601c04";

            // req.payload.referralCode = req.payload.referralCode ? req.payload.referralCode : "";
            req.payload.password = Bcrypt.hashSync(req.payload.password, parseInt(config.SaltRounds));//hash the password and store in db
            customer.isExistsWithIdType(condition, (err, isExist) => {
                if (isExist) {
                    req.payload.userType = 3;//user type 3 for update
                    customer.saveDetails(req.payload, (err, result) => {
                        if (err) {
                            logger.error('Error occurred during customer signup (saveDetails 1): ' + JSON.stringify(err));
                            return reply({ message:req.i18n.__('genericErrMsg')['500']  }).code(500);
                        }
                        let id = req.auth.credentials ? req.auth.credentials._id.toString() : result.value._id;
                        req.payload.newUserId = id;
                        updateLogs(id, 1, req.payload, (err, res) => {
                        });//asynchronously update the login status
                        return cb(null, id);
                    });
                } else {
                    req.payload.userType = 1; //user type 1 for insert
                    customer.saveDetails(req.payload, (err, result) => {
                        if (err) {
                            logger.error('Error occurred during customer signup (saveDetails 2): ' + JSON.stringify(err));
                            return reply({ message: req.i18n.__('genericErrMsg')['500']   }).code(500);
                        }
                        let id = result.insertedIds[0];
                        req.payload.newUserId = id;
                        updateLogs(id, 1, req.payload, (err, res) => {
                        });//asynchronously update the login status
                        return cb(null, id);
                    });
                }
            });
        },
        (cb,ID) => {
            verificationCode.saveVerificationCode({
                id: req.auth.credentials ? req.auth.credentials._id.toString() : "5a86debdb5a1dd17f1601c04",
                email: req.payload.email,
            }, (err, response) => {
                if (err) {
                    logger.error('Error occurred during customer signup (saveVerificationCode): ' + JSON.stringify(err));
                    return reply(err);
                }
                return cb(null, ID);
            })
        }


    ], (err, results) => {
        if (err)
            return reply(err);

        email.getTemplateAndSendEmail({
            templateName: 'customerNewSignup.html',
            toEmail: req.payload.email,
            subject: 'Welcome to ' + config.appName,
            trigger: 'New Registration',
            keysToReplace: { username: req.payload.name.charAt(0).toUpperCase() + req.payload.name.slice(1), appName: config.appName }
        }, () => {
        });
        if (req.payload.customerPOSId == "undefined" || req.payload.customerPOSId == undefined) {
            referralCampaigns.referralCodeHandler({ userId: req.payload.newUserId.toString(), userType: 1, firstName: req.payload.name, lastName: "", email: req.payload.email, countryCode: req.payload.countryCode, phoneNumber: req.payload.mobile, referralCode: req.payload.referralCode ? req.payload.referralCode : "", cityId: req.payload.cityId, zoneId: req.payload.zoneId }, (err, doc) => { });
             return reply({ message: req.i18n.__('slaveRegisterUser')['200']   }).code(200);
        }else{
            return reply({ message: req.i18n.__('slaveRegisterUser')['200']  , data: { customerMongoId: results[3] } }).code(200);
        }

       
    });
}

/** 
 * @function
 * @name updateLogs
 * @param {string} id - customer id.
 * @param {string} userType - customer or guest
 * @param {object} data - data coming from req.payload
 */
function updateLogs(id, userType, data, callback) {


    data.id = id
    data.userType = userType

    mobileDevices.updateMobileDevices(data, (err, result) => {

        if (err) {
            logger.error('Error occurred during customer signup (updateMobileDevices): ' + JSON.stringify(err));
            return callback('Error updating customer signin status');
        }
        customer.updateDeviceLog(data, (err, result) => {

            if (err) {
                logger.error('Error occurred during customer signup (updateDeviceLog): ' + JSON.stringify(err));
                return callback('Error updating customer signin status');
            }
            return callback(null, result.lastErrorObject.updatedExisting);
        });
    });

}


/**
* A module that exports business get store handler! 
* @exports handler 
*/
module.exports = { handler }