"use strict";
const driver = require("../../../../../models/driver");
const zones = require("../../../../../models/zones");
const verificationCode = require("../../../../../models/verificationCode");
const cities = require("../../../../../models/cities");
const Auth = require("../../../../middleware/authentication");
const error = require("../../../../../locales"); // response messages based on language
const config = process.env;
const Bcrypt = require("bcrypt"); //hashing module
const Joi = require("joi");
const async = require("async");
const ObjectID = require("mongodb").ObjectID;
const moment = require("moment");
const logger = require("winston");
const sendMsg = require("../../../../../library/twilio");
const sendMail = require("../../../../../library/mailgun");
const cheerio = require("cheerio"); //to extract the html from html files
const fs = require("fs");
const jwt = require("jsonwebtoken");
const status = require("../../../../../statusMessages/statusMessages");
const email = require("../../../../commonModels/email/email");
let geocodder = require("node-geocoder");
var options = {
  provider: "google",
  // Optionnal depending of the providers
  httpAdapter: "https", // Default
  apiKey: config.GoogleMapsApiKEy, // for Mapquest, OpenCage, Google Premier
  formatter: null // 'gpx', 'string', ...
};
let geo = geocodder(options);
const Timestamp = require("mongodb").Timestamp;
/**
 * @function
 * @name handler
 * @param  {string} deviceType:   1 - IOS , 2 - Android
 * @param  {string}  driverType -1- Freelancer, 2- Store required
 * @return {object} Reply to the user.
 */
const handler = (req, reply) => {
  let mongoId = new ObjectID();
  let fcmTopic = mongoId.toString() + moment().unix(); //generate a new fcmTopic on new login
  let mqttTopic = mongoId.toString() + moment().unix(); //generate a new mqttTopic on new login
  let dL = req.payload.driverLicense.split(",");
  var userdata = {
    email: req.payload.email,
    password: Bcrypt.hashSync(req.payload.password, parseInt(config.SaltRounds)), //hash the password and store in db
    firstName: req.payload.firstName,
    lastName: req.payload.lastName || "",
    profilePic: req.payload.profilePic,
    countryCode: req.payload.countryCode,
    mobile: req.payload.mobile,
    zipCode: req.payload.zipCode,
    status: 1,
    dob: req.payload.dateOfBirth ? req.payload.dateOfBirth : "",
    statusMsg: "New",
    companyId: 0,
    zones: req.payload.zones || [],
    serviceZones: req.payload.zones || [],
    // specialities: [],
    driverType: req.payload.accountType,
    driverLicense: req.payload.driverLicense,
    cityId: req.payload.cityId ? req.payload.cityId : "",
    cityName: req.payload.cityName ? req.payload.cityName : "",
    location: { longitude: 0, latitude: 0 },
    createdDate: moment().unix(),
    createdTimestamp: new Timestamp(1, moment().unix()),
    createdISOdate: new Date(),
    driverLicenseFront: dL[0] ? dL[0] : "",
    driverLicenseBack: dL[1] ? dL[1] : "",
    driverLicenseNumber: req.payload.driverLicenseNumber ? req.payload.driverLicenseNumber : "",
    driverLicenseExpiry: req.payload.driverLicenseExpiry ? req.payload.driverLicenseExpiry : "",
    mobileDevices: {
      lastLogin: moment().unix(),
      appVersion: req.payload.appVersion ? req.payload.appVersion : ""
    },
    mobileVerified: true,
    wallet: {
      balance: 0,
      blocked: 0,
      hardLimit: 0,
      softLimit: 0,
      softLimitHit: false,
      hardLimitHit: false
    },
    acceptance: {
      acceptedBookings: 0,
      totalBookings: 0,
      acceptanceRate: 0,
      ignoredBookings: 0,
      rejectedBookings: 0,
      cancelledBookings: 0
    }
  };

  async.waterfall(
    [
      cb => {
        driver.isExists(
          { email: userdata.email, mobile: userdata.mobile, countryCode: req.payload.countryCode },
          (err, doc) => {
            if (err) {
              logger.error("Error occurred during driver signup (isExists1): " + JSON.stringify(err));
              return cb({ message: req.i18n.__("genericErrMsg")["500"] }).code(500);
            }
            if (doc === null) return cb(null, true);

            if (typeof doc.email != "undefined" && doc.email === userdata.email)
              // return reply({ message: error['postSignUp']['412'] }).code(412);
              return reply({ message: req.i18n.__("postSignUp")["412"] }).code(412);
            if (typeof doc.mobile != "undefined" && doc.mobile === userdata.mobile)
              // return reply({ message: error['postSignUp']['413'] }).code(413);
              return reply({ message: req.i18n.__("postSignUp")["413"] }).code(413);
          }
        );
      }, //check if email or mobile is already in use

      // (toContinue, cb) => {
      //     zones.inZone({ lat: parseFloat(req.payload.latitude || 0.0), long: parseFloat(req.payload.longitude || 0.0) }, (err, city) => {
      //         // cities.selectCity({ long: parseFloat(req.payload.longitude || 0.0), lat: parseFloat(req.payload.latitude || 0.0) }, (err, city) => {
      //         if (err) {
      //             logger.error('Error occurred during driver signup (inZone): ' + JSON.stringify(err));
      //             return cb({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);
      //         }
      //         if (city != null)
      //             userdata.cityId = new ObjectID(city.city_ID);

      //         return cb(null, true);
      //     });
      // }, //get the cityId
      (toContinue, cb) => {
        let geoip = require("geoip-lite");
        let geoCalcIp = geoip.lookup(req.payload.ipAddress);
        userdata.registeredFromCity = geoCalcIp ? geoCalcIp.city : "";
        userdata.ip = {
          address: req.payload.ipAddress ? req.payload.ipAddress : "",
          city: geoCalcIp ? geoCalcIp.city : ""
        };
        try {
          geo.reverse({ lat: req.payload.latitude || 0, lon: req.payload.longitude || 0 }, (err, data) => {
            if (data && data[0]) {
              userdata.registeredFromCity = data[0]["city"] ? data[0]["city"] : "";
            }
            return cb(null, true);
          });
        } catch (e) {
          return cb(null, true);
        }
      }, //get the cityId

      (toContinue, cb) => {
        driver.saveReferralCode(userdata, (err, result) => {
          if (err) {
            logger.error("Error occurred during driver signup (saveReferralCode): " + JSON.stringify(err));
            return cb({ message: req.i18n.__("genericErrMsg")["500"] });
          }
          var ID = result.insertedIds[0].toString();
          return cb(null, true);
        });
      } //create the master account
    ],
    (err, data) => {
      if (err) return reply(err);
      if (config.mailGunService == "true") {
        email.getTemplateAndSendEmail(
          {
            templateName: "driverNewSignUp.html",
            toEmail: req.payload.email,
            subject: "Welcome to " + config.appName + "!",
            trigger: "Driver New Registration",
            keysToReplace: {
              appName: config.appName,
              username: req.payload.lastName
                ? req.payload.firstName + " " + req.payload.lastName
                : req.payload.firstName
            }
          },
          () => { }
        );
      }
      // return reply({ message: error['postSignUp']['200'] }).code(200);
      return reply({ message: req.i18n.__("postSignUp")["200"] }).code(200);
    }
  );
};

/**
 * @function
 * @name updateLogs
 * @param {string} id - customer id.
 * @param {string} userType - customer or guest
 * @param {object} data - data coming from req.payload
 */
function updateLogs(id, userType, data, callback) {
  data.id = id;
  data.userType = userType;

  mobileDevices.updateMobileDevices(data, (err, result) => {
    if (err) {
      logger.error("Error occurred during driver signup (updateMobileDevices): " + JSON.stringify(err));
      return callback("Error updating customer signup status");
    }
    driver.updateDeviceLog(data, (err, result) => {
      if (err) return callback("Error updating customer signup status");
      return callback(null, result.lastErrorObject.updatedExisting);
    });
  });
} //update the login status of the customer, logs out from all the other devices

/**
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
  firstName: Joi.string()
    .required()
    .description("First name"),
  lastName: Joi.any().description("Last name"),
  email: Joi.string()
    .trim()
    .empty("")
    .email()
    .required()
    .description("Email"),
  password: Joi.string()
    .required()
    .description("Password"),
  countryCode: Joi.string()
    .trim()
    .empty("")
    .required()
    .description("Country code"),
  mobile: Joi.string()
    .trim()
    .empty("")
    .required()
    .description("Mobile"),
  zipCode: Joi.string().description("Zip code"),
  latitude: Joi.number()
    .required()
    .description("Latitude"),
  longitude: Joi.number()
    .required()
    .description("Longitude"),
  profilePic: Joi.string()
    .required()
    .description("Profile pic"),
  referral: Joi.any().description("In case of referral"),
  // zones: Joi.any().description('Provide array'),
  zones: Joi.array()
    .items()
    .description("Provide array"),
  operator: Joi.any().description("Operator ID"),
  driverLicense: Joi.string()
    .allow("")
    .description("Give all images comma(,) separated"),
  accountType: Joi.number()
    .required()
    .description("1 - Freelancer,2- store"),
  deviceType: Joi.number()
    .required()
    .integer()
    .min(1)
    .max(2)
    .description("1 - Ios,2 - Android"),
  deviceId: Joi.string().required(),
  deviceOsVersion: Joi.string().description("Device Os Version"),
  appVersion: Joi.string().description("Version of the app being used"),
  deviceMake: Joi.string().description("Maker of the device"),
  deviceModel: Joi.string().description("Model of the device"),
  pushToken: Joi.string().description("Push token of the device"),
  ipAddress: Joi.string().description("Ip Address"),
  driverLicenseNumber: Joi.string()
    .allow("")
    .description("driverLicenseNumber")
    .allow(""),
  driverLicenseExpiry: Joi.string()
    .allow()
    .description("driverLicenseExpiry")
    .allow(""),
  cityId: Joi.string()
    .description("cityId")
    .allow(""),
  cityName: Joi.string()
    .description("cityName")
    .allow(""),
  dateOfBirth: Joi.string()
    .description("dateOfBirth")
    .allow("")
};
/**
 * A module that exports customerSignup's handler, validator!
 * @exports validator
 * @exports handler
 */
module.exports = { handler, validator };
