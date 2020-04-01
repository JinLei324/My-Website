'use strict'
const customer = require('../../../../../models/customer');
const cities = require('../../../../../models/cities');
const zones = require('../../../../../models/zones');
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
const userList = require('../../../../commonModels/userList');

// const referralCampaigns = require('../../../referralCampaigns/post');
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
    let cityData = {};
    async.series([
        (cb) => {

            cities.inZone({ lat: req.payload.latitude || 0, long: req.payload.longitude || 0 }, (err, data) => {
                if (err) {
                    logger.error('Error occurred during signup dispatcher customer (inZone): ' + JSON.stringify(err));
                    return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);
                }
                if (data && data.cities) {
                    cityData = data.cities[0]
                    return cb(null, 'done');
                    //  resolve(cityData);
                }
                else {
                    logger.warn('came')
                    cityData = {}
                    return cb(null, 'done');
                    // resolve(cityData);
                    // reject({ code: 400 });
                }
            });

        }, (cb) => {
            customer.count({ email: req.payload.email, status: { $nin: [4, '4'] } }, (e, r) => {
                if (e) {
                    logger.error('Error occurred during customer signup (count email): ' + JSON.stringify(e));
                    return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);
                }
                if (r > 0)
                    return reply({ message: req.i18n.__('postSignUp')['412'] }).code(412);
                return cb(null, 'done');
            });
        }, //check if the email is already registered
        (cb) => {
            customer.count({ countryCode: req.payload.countryCode, phone: req.payload.mobile, status: { $nin: [4, '4'] } }, (e, r) => {
                if (e) {
                    logger.error('Error occurred during customer signup (count phone): ' + JSON.stringify(e));
                    return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);
                }
                if (r > 0)
                    return reply({ message: req.i18n.__('postSignUp')['413'] }).code(413);
                return cb(null, 'done');
            });
        }, //check if the phone is already registered

        (cb) => {
            req.payload.cityId = cityData.cityId;
            req.payload.cityName = cityData.cityName;
            req.payload.isPasswordSet = 0;
            let mongoId = new ObjectID();
            let fcmTopic = 'FCM-' + mongoId.toString() + moment().unix();//generate a new fcmTopic on new login
            req.payload.mqttTopic = 'MQTT-' + mongoId.toString() + moment().unix();//generate a new fcmTopic 
            req.payload.fcmTopic = fcmTopic;
            customer.dispatcherCustomer(req.payload, (err, result) => {
                if (err) {
                    logger.error('Error occurred during customer signup (saveDetails 1): ' + JSON.stringify(err));
                    return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);
                }
                let data = result.value;
                return cb(null, data);
            });
        }
    ], (err, results) => {
        if (err)
            return reply(err);

        return reply({ message: req.i18n.__('genericErrMsg')['200'], data: results[3] }).code(200);

    });
}



/**
* A module that exports business get store handler! 
* @exports handler 
*/
module.exports = { handler }