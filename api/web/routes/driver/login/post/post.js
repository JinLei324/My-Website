"use strict";
const driver = require("../../../../../models/driver");
const mobileDevices = require("../../../../../models/mobileDevices");
const appConfig = require("../../../../../models/appConfig");
const verificationCode = require("../../../../../models/verificationCode");
const appVersions = require("../../../../../models/appVersions");
const Auth = require("../../../../middleware/authentication");
const error = require("../../../../../locales"); // response messages based on language
const status = require("../../../../../statusMessages/statusMessages");
const config = process.env;
const Bcrypt = require("bcrypt"); //hashing module
const Joi = require("joi");
const async = require("async");
const ObjectID = require("mongodb").ObjectID;
const moment = require("moment");
const logger = require("winston");
const notifyi = require("../../../../../library/mqttModule/mqtt");
const notifications = require("../../../../../library/fcm");
const notifyiWebsocket = require("../../../../../library/websocket/websocket");
const dispatcher = require("../../../../commonModels/dispatcher");
const userList = require("../../../../commonModels/userList");
const city = require("../../../../../models/cities");
/**
 * @function
 * @name handler
 * @param  {string} deviceType:   1 - IOS , 2 - Android
 * @param  {string}  driverType -1- Freelancer, 2- store required
 * @return {object} Reply to the user.
 */
const handler = (req, reply) => {
  logger.warn(JSON.stringify(req.payload));
  appConfig.get({}, (err, appConfig) => {
    if (err) {
      logger.error("Error occurred during driver sigini(appconfig get): " + JSON.stringify(err));
      // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']) }).code(500);
    }
    let accessTokenExp = 604800; //7days

    if (appConfig) {
      accessTokenExp = appConfig.securitySettings ? parseInt(appConfig.securitySettings.accessToken) : accessTokenExp;
    }
    async.waterfall(
      [
        cb => {
          driver.isExists({
            email: req.payload.mobile,
            countryCode: req.payload.countryCode,
            mobile: req.payload.mobile
          },
            (e, r) => {
              if (e) {
                logger.error("Error occurred during driver signin (isExists): " + JSON.stringify(e));
                // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']) }).code(500);
                return reply({
                  message: req.i18n.__("genericErrMsg")["500"]
                }).code(500);
              }
              if (r === null)
                // return reply({ message: error['postSignIn']['400'] }).code(400);
                return reply({
                  message: req.i18n.__("postSignIn")["400"]
                }).code(400);
              let isPasswordValid = Bcrypt.compareSync(req.payload.password, r.password);

              if (!isPasswordValid)
                // return reply({ message: error['postSignIn']['401'] }).code(401);
                return reply({
                  message: req.i18n.__("postSignIn")["401"]
                }).code(401);
              switch (r.status) {
                case 1:
                  // return reply({ message: error['postSignIn']['405'] }).code(405);
                  return reply({
                    message: req.i18n.__("postSignIn")["405"]
                  }).code(405);

                  break;
                case 6:
                  // return reply({ message: req.i18n.__('postSignIn')['403'] }).code(403);
                  return reply({
                    message: req.i18n.__("postSignIn")["403"]
                  }).code(403);

                  break;
                case 7:
                  // return reply({ message: req.i18n.__('postSignIn')['406'] }).code(406);
                  return reply({
                    message: req.i18n.__("postSignIn")["406"]
                  }).code(406);
                  break;
              }
              let authToken = Auth.SignJWT({
                _id: r._id.toString(),
                key: "acc",
                deviceId: req.payload.deviceId
              },
                "driver",
                accessTokenExp
              ); //sign a new JWT

              r.authToken = authToken;

              return cb(null, r);
            }
          );
        }, //check if the master exists and has valid credentials

        (data, cb) => {

          // Get city details 

          city.readByCityId({
            'cities.cityId': new ObjectID(data.cityId)
          }, (cityErr, cityDetails) => {
            if (cityErr) {
              // statement
              logger.error("Error occurred during driver signin (callback): " + JSON.stringify(cityErr));
              // return reply(cityErr);
            } else {

              if (cityDetails) {
                req.payload.mqttKey = "driver_" + data._id.toString() + req.payload.deviceId;
                let pushTopic = data._id.toString() + "-" + moment().unix(); //generate a new pushTopic on login
                let topicsToPush = [];
                if (data.preferredZones && data.preferredZones.length > 0) {
                  for (let i = 0; i < data.preferredZones.length; i++) {
                    topicsToPush.push("driver_" + data.preferredZones[i]);
                  }
                }



                topicsToPush.push(pushTopic);
                topicsToPush.push("driver_" + data.cityId);
                let responseData = {
                  chn: "driver_" + data._id.toString() + req.payload.deviceId,
                  // 'chn': 'driver_' + req.payload.deviceId,
                  driverId: data._id.toString(),
                  token: data.authToken,
                  payfortUrl: "https://payfort.mandobe.com/index.php",
                  code: data.referralCode,
                  presence_chn: config.presChnl,
                  // 'vehicles': vehicle,
                  //  'vehicleType': data.vehicleType ? data.vehicleType.toString() : "",
                  stripeKey: config.STRIPE_PUBLISHABLE_KEY ? config.STRIPE_PUBLISHABLE_KEY : "",
                  driverType: data.driverType,
                  googleMapKeyMqtt: "googleMapKey",
                  name: data.firstName,
                  email: data.email,
                  countryCode: data.countryCode,
                  profilePic: data.profilePic,
                  pushTopic: pushTopic,
                  fcmTopics: topicsToPush,
                  serviceZones: data.serviceZones,
                  cityId: data.cityId,
                  defaultBankAccount: cityDetails.cities[0].defaultExternalAccount ? cityDetails.cities[0].defaultExternalAccount.accountNumber : "",
                  country: cityDetails.cities[0].countryCode ? cityDetails.cities[0].countryCode : "",
                  currency: cityDetails.cities[0].currency ? cityDetails.cities[0].currency : "",
                  enableBankAccount: cityDetails.cities[0].bankAccountingLinking ? cityDetails.cities[0].bankAccountingLinking : 1


                };


                if (data.mobileDevices && data.mobileDevices.deviceId != req.payload.deviceId) {
                  notifications.notifyFcmTopic({
                    action: 12,
                    usertype: 2,
                    deviceType: data.mobileDevices ? data.mobileDevices.deviceType : 1,
                    notification: "",
                    msg: req.i18n.__(req.i18n.__('driverStatus')['sessionmsg']),
                    fcmTopic: data.pushToken,
                    title: req.i18n.__(req.i18n.__('driverStatus')['sessiontitle']),
                    data: {
                      deviceId: req.payload.deviceId
                    }
                  },
                    () => { }
                  ); // fcm event
                  notifyi.notifyRealTime({
                    listner: data.publishChn,
                    message: {
                      action: 12,
                      message: "Session Expired",
                      deviceId: req.payload.deviceId
                    }
                  }); // mqtt event
                }
                data.deviceOsVersion = req.payload.deviceOsVersion;
                updateLogs(data._id.toString(), 2, req.payload, pushTopic, () => {
                  driver.setExPresence({
                    key: "presence_" + data._id.toString(),
                    presenceTime: 15,
                    extra: data._id.toString()
                  },
                    (err, result) => { }
                  );
                  dispatcher.providerStatus({
                    _id: data._id
                  }, (err, res) => { });
                  return cb(null, responseData);
                }); //asynchronously update the login status
                userList.createUser(
                  data._id.toString(),
                  data.firstName,
                  data.lastName || "",
                  pushTopic || "",
                  data.profilePic || "",
                  data.countryCode + data.mobile || "",
                  2,
                  pushTopic || "",
                  "driver_" + data._id.toString(),
                  req.payload.deviceType || 2
                );
              } else {
                logger.info("City details not found ")
              }

            }
          })

        }
      ],
      (err, results) => {
        if (err) {
          logger.error("Error occurred during driver signin (callback): " + JSON.stringify(err));
          return reply(err);
        }
        // return reply({ message: error['postSignIn']['200'], data: results }).code(200);

        return reply({
          message: req.i18n.__("postSignIn")["200"],
          data: results
        }).code(200);
      }
    );
  });
};

/**
 * @function
 * @name getVehicleData_
 * @param {string} driverid - driver id.
 * @param {string} companyId - company id
 * @param {integer} driverType - 1- Freelancer, 2- Operator 3- store required
 * @param {object} vehicleId - vehicle Id
 */
const getVehicleData_ = (driverid, companyId, driverType, vehicleId, callbackNew) => {
  var condition = {};

  if (vehicleId != "") condition = {
    _id: new ObjectID(vehicleId)
  };
  if (driverType == 1) condition = {
    driverId: new ObjectID(driverid),
    status: {
      $in: [2, 4, 5]
    }
  }; //remove 1 later
  if (driverType == 2) condition = {
    driverId: new ObjectID(driverid),
    status: {
      $in: [2, 4, 5]
    }
  };

  if (driverType == 3) condition = {
    driverId: new ObjectID(driverid),
    status: {
      $in: [2, 4, 5]
    }
  };

  vehicles.selectWithMerge(condition, (err, vehicles) => {
    if (err)
      // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[0] }).code(500);
      return reply({
        message: req.i18n.__("genericErrMsg")["500"]
      }).code(500);
    return callbackNew(vehicles);
  });
};

/**
 * @function
 * @name updateLogs
 * @param {string} id - customer id.
 * @param {string} userType - customer or guest
 * @param {object} data - data coming from req.payload
 * @param {object} pushTopic - pushTopic
 * @param {object} vehicleData - data coming from vehicle
 */
const updateLogs = (id, userType, data, pushTopic, callback) => {
  data.id = id;
  data.userType = userType;
  data.pushToken = pushTopic;
  mobileDevices.updateMobileDevices(data, (err, result) => {
    if (err) return callback("Error updating customer signin status");
    driver.updateDeviceStatusLog(data, (err, result) => {
      if (err) return callback("Error updating customer signin status");
      appVersions.updateAppVersions({
        userId: new ObjectID(id),
        type: parseInt((parseInt(data.deviceType) == 2 ? 1 : 2) + "" + 1),
        appVersion: data.appVersion
      },
        () => { }
      ); //update the userId in the appVersions document

      return callback(null, result.lastErrorObject.updatedExisting);
    });
  });
}; //update the login status of the customer, logs out from all the other devices

/**
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
  countryCode: Joi.string()
    .required()
    .description("Country code"),
  mobile: Joi.string()
    .required()
    .description("Mobile number"),
  password: Joi.string().required(),
  deviceId: Joi.string()
    .required()
    .description("Device id"),
  pushToken: Joi.string()
    .description("Push token")
    .allow(""),
  appVersion: Joi.string()
    .required()
    .description("App version"),
  deviceMake: Joi.string()
    .required()
    .description("Device Make"),
  deviceModel: Joi.string()
    .required()
    .description("Device model"),
  deviceOsVersion: Joi.string().description("Device Os Version"),
  deviceType: Joi.number()
    .required()
    .integer()
    .min(1)
    .max(3)
    .description("1- IOS , 2- Android, 3-Web"),
  deviceTime: Joi.string()
    .required()
    .description("Format : YYYY-MM-DD HH:MM:SS")
};
/**
 * A module that exports customer signin's handler, validator!
 * @exports validator
 * @exports handler
 */
module.exports = {
  handler,
  validator
};
