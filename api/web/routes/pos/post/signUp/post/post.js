'use strict'
const customer = require('../../../../../../models/customer');
const mobileDevices = require('../../../../../../models/mobileDevices');
const verificationCode = require('../../../../../../models/verificationCode');
const Auth = require('../../../../../middleware/authentication');
const error = require('../../../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const Bcrypt = require('bcrypt');//hashing module 
const Joi = require('joi');
const async = require('async');
const ObjectID = require('mongodb').ObjectID;
const moment = require('moment');
const logger = require('winston');
const sendMsg = require('../../../../../../library/twilio')
const sendMail = require('../../../../../../library/mailgun')
const cheerio = require('cheerio');//to extract the html from html files
const fs = require('fs');
const jwt = require('jsonwebtoken');
const email = require('../../../../../commonModels/email/email');

// const referralCampaigns = require('../../../../referralCampaigns/post');
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
    let condition = {};

    let mongoId = new ObjectID();
    let fcmTopic = 'FCM-' + mongoId.toString() + moment().unix();//generate a new fcmTopic on new login
    let mqttTopic = 'MQTT-' + mongoId.toString() + moment().unix();//generate a new mqttTopic on new login
    req.payload.coordinates = { longitude: parseFloat(req.payload.longitude || 0.0), latitude: parseFloat(req.payload.latitude || 0.0) }
    req.payload.fcmTopic = fcmTopic;
    req.payload.mqttTopic = mqttTopic;


    async.series([
        (cb) => {
            customer.count({ customerPOSId: req.payload.customerPOSId }, (e, r) => {
                if (e) {
                    logger.error('Error occurred during customer signup (count email): ' + JSON.stringify(e));
                    return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[req.headers.language] }).code(500);
                }
                if (r > 0)
                    req.payload.newUser = 0;
                return cb(null, 'done');
            });
        }, //check if the customerPOSId is already registered
        (cb) => {
            customer.count({ email: req.payload.email }, (e, r) => {
                if (e) {
                    logger.error('Error occurred during customer signup (count email): ' + JSON.stringify(e));
                    return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[req.headers.language] }).code(500);
                }
                if (r > 0) {
                    if (req.payload.newUser == 0) {
                        return cb(null, 'done');
                    } else {
                        return reply({ message: error['postSignUp']['412'][req.headers.language] }).code(412);
                    }
                } else {
                    req.payload.newEmail = true
                    return cb(null, 'done');
                }
            });
        }, //check if the email is already registered
        (cb) => {
            customer.count({ countryCode: req.payload.countryCode, phone: req.payload.mobile }, (e, r) => {
                if (e) {
                    logger.error('Error occurred during customer signup (count phone): ' + JSON.stringify(e));
                    return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[req.headers.language] }).code(500);
                }
                if (r > 0) {
                    if (req.payload.newUser == 0) {
                        return cb(null, 'done');
                    } else {
                        return reply({ message: error['postSignUp']['413'][req.headers.language] }).code(413);
                    }
                } else {
                    req.payload.newPhone = true
                    return cb(null, 'done');
                }
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

            req.payload.password = Bcrypt.hashSync(req.payload.password, parseInt(config.SaltRounds));//hash the password and store in db
            customer.saveDetailsPos(req.payload, (err, result) => {
                if (err) {
                    logger.error('Error occurred during customer signup (saveDetails 1): ' + JSON.stringify(err));
                    return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[req.headers.language] }).code(500);
                }
                let id = result.value._id;
                updateLogs(id, 1, req.payload, (err, res) => {
                });//asynchronously update the login status
                return cb(null, id);
            });

        }


    ], (err, results) => {
        if (err)
            return reply(err);
        return reply({ message: error['slaveRegisterUser']['200'][req.headers.language], data: { customerMongoId: results[4] } }).code(200);

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