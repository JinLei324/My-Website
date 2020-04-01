"use strict";
const driver = require("../../../../../models/driver");
const locationLogs = require("../../../../../models/locationLogs");
const appConfig = require("../../../../../models/appConfig");
let bookingsUnassigned = require('../../../../../models/bookingsUnassigned');
const rabbitMq = require('../../../../../library/rabbitMq');
const Auth = require("../../../../middleware/authentication");
const error = require("../../../../../locales"); // response messages based on language
const config = process.env;
const Bcrypt = require("bcrypt"); //hashing module
const Joi = require("joi");
const async = require("async");
const ObjectID = require("mongodb").ObjectID;
const moment = require("moment");
const logger = require("winston");
const presence = require("../../../../commonModels/presence");
const redis = require('../../../../../library/redis');
const notifyi = require("../../../../../library/mqttModule/mqtt");
const dispatcher = require("../../../../commonModels/dispatcher");
const serverDispatcher = require("../../../../../worker/handlers/serverDispatcher");

/**
 * @function
 * @name handler
 * @return {object} Reply to the user.
 */
const handler = (req, reply) => {
  var appConfigData = {};
  const read = (itemId, zoneId) => {
    return new Promise((resolve, reject) => {
      driver.isExistsWithId({
        _id: new ObjectID(req.auth.credentials._id.toString())
      }, (err, data) => {
        if (err) {
          reject(err);
        }
        resolve(data);
      });
    });
  };

  const readConfig = (itemId, zoneId) => {
    return new Promise((resolve, reject) => {
      appConfig.get({}, (err, appConfigRes) => {
        if (err) {
          logger.error('Error occurred during superadmin send otp(appconfig get): ' + JSON.stringify(err));
          reject(err)
        }
        if (appConfigRes) {

          appConfigData = appConfigRes
          resolve(appConfigRes)

        }
      });
    });
  };
  const searchBookingForDriver = () => {
    return new Promise((resolve, reject) => {
      // check driver is online and search near by booking for driver
      if (req.user.status == 3) {
        bookingsUnassigned.Count({}, function (err, bookingCount) {
          if (bookingCount > 0) {
            redis.client.exists("did_" + req.auth.credentials._id, function (err, data) {
              if (data !== 1) {
                var locationData = {
                  'masId': req.auth.credentials._id.toString(),
                  'lat': req.payload.latitude,
                  'lng': req.payload.longitude,
                };
                rabbitMq.sendToQueue(rabbitMq.queueMasterLocation, locationData);
              }
            });
          }
        });
      }
      resolve(true);
    });
  }

  readConfig()
    .then(searchBookingForDriver)
    .then(read)
    .then(driverData => {
      let warnMessage = "";
      switch (driverData.status) {
        case 7:
          warnMessage = "Your profile got banned by our admin, please contact our support for further queries";
          return reply({
            message: warnMessage
          }).code(498);
          break; //cb reject
        case 6:
          warnMessage = "Your profile got rejected by our admin, please contact our support for further queries.";
          return reply({
            message: warnMessage
          }).code(498);
          break; //cb success
        case 1:
          warnMessage =
            "One of our representatives will get in touch with you in the next 24 hours to setup your profile and get all the necessary documents.";
          return reply({
            message: warnMessage
          }).code(498);
          break;
        case 8:
          warnMessage =
            "You have been logged out by our operations team, please login again to continue accessing your account.";
          return reply({
            message: warnMessage
          }).code(498);
          break; //cb ban
      }

      if (req.payload.pubnubStr && req.payload.pubnubStr != "undefined" && parseInt(req.payload.transit) == 1) {
        // if (req.payload.pubnubStr && req.payload.pubnubStr != 'undefined') {

        let PublishData = req.payload.pubnubStr.split(","); //might be in multiple bookings
        for (let key = 0; key < PublishData.length; key++) {
          let getOneElement = PublishData[key].split("|");
          let ltlg;
          // if (getOneElement[1] != '')
          //     logger.info('location update getOneElement' + JSON.stringify(getOneElement))
          ltlg = req.payload.latitude + "," + req.payload.longitude;
          let logData = {};
          logData[getOneElement[2].toString()] = ltlg;
          notifyi.notifyRealTime({
            listner: getOneElement[1],
            message: {
              action: 14,
              message: "live track",
              destinationName: "driverLocation",
              driverId: driverData._id.toString(),
              latitude: req.payload.latitude,
              longitude: req.payload.longitude,
              bid: parseInt(getOneElement[0])
            }
          }); // mqtt event
          locationLogs.pushLogs({
            bid: parseInt(getOneElement[0]),
            logData: logData
          },
            (err, result) => {
              if (err) logger.error("Error occurred during driver location update (pushLogs) : " + JSON.stringify(err));
            }
          );
        }
      }
      driver.updateAllLogs({
        _id: new ObjectID(req.auth.credentials._id),
        newdata: {
          status: req.payload.status, //  3- online 4- offline
          timedOut: true,
          location: {
            longitude: parseFloat(req.payload.longitude),
            latitude: parseFloat(req.payload.latitude)
          },
          // vehicleType: req.payload.vehicleType ? new ObjectID(req.payload.vehicleType) : "",
          "mobileDevices.lastLogin": moment().unix(), //lastTs
          "mobileDevices.appVersion": req.payload.appVersion,
          batteryPer: req.payload.batteryPer ?
            parseFloat(req.payload.batteryPer)
              .toFixed(1)
              .toString() :
            "0",
          locationCheck: req.payload.locationCheck,
          "mobileDevices.deviceType": req.payload.deviceType,
          locationHeading: req.payload.locationHeading
        }
      },
        (err, result1) => {
          if (err) {
            // if (err)
            // logger.error("Error occurred during driver location update (updateAllLogs) : " + JSON.stringify(err));
            // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']) }).code(500);
            return reply({
              message: req.i18n.__("genericErrMsg")["500"]
            }).code(500);
          }

          if (req.payload.status == 3) {

            presence.driverStatusPresence({
              mid: req.auth.credentials._id,
              status: 3
            }, (err, res) => { });

            driver.presence_exists({
              _id: req.auth.credentials._id
            }, (err, data) => {
              if (data == 1) {
                driver.setExPresence({
                  key: "presence_" + req.auth.credentials._id.toString(),
                  presenceTime: appConfigData.presenceSettings.presenceTime,
                  extra: req.auth.credentials._id
                },
                  (err, result) => { }
                );
              } else {
                driver.setExPresence({
                  key: "presence_" + req.auth.credentials._id.toString(),
                  presenceTime: appConfigData.presenceSettings.presenceTime,
                  extra: req.auth.credentials._id
                },
                  (err, result) => { }
                );
                dispatcher.providerStatus({
                  _id: req.auth.credentials._id.toString()
                }, (err, res) => {
                  // websocket publish
                });
              }
            });

            dispatcher.liveTrack({
              _id: req.auth.credentials._id.toString()
            }, (err, res) => { }); // websocket publish
          }
          driver.did_exists({
            _id: req.auth.credentials._id
          }, (err, data) => {
            if (err) logger.error("Error occurred during driver location  (did_exists) : " + JSON.stringify(err));
            if (data !== 1)
              // return reply({ message: error['slaveUpdateProfile']['200'], data: { flag: 1, bid: 0 } }).code(200);
              return reply({
                message: req.i18n.__("slaveUpdateProfile")["200"],
                data: {
                  flag: 1,
                  bid: 0
                }
              }).code(200);
            else
              driver.did_get({
                _id: req.auth.credentials._id
              }, (err, bid) => {
                if (err) logger.error("Error occurred during driver location  (did_get) : " + JSON.stringify(err));
                // return reply({ message: error['slaveUpdateProfile']['200'], data: { flag: 1, bid: bid } }).code(200);
                else
                  return reply({
                    message: req.i18n.__("slaveUpdateProfile")["200"],
                    data: {
                      flag: 1,
                      bid: bid
                    }
                  }).code(
                    200
                  );
              });
          });
        }
      );
    })
    .catch(e => {
      logger.error("err during get fare(catch) " + JSON.stringify(e));
      // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
      return reply({
        message: request.i18n.__("genericErrMsg")["500"]
      }).code(500);
    });
};

/**
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
  longitude: Joi.number()
    .required()
    .description("longitude"),
  latitude: Joi.number()
    .required()
    .description("latitude"),
  // vehicleType: Joi.string().description('vehicle Type id').default("59e75a984e25d56c9f078dc4"),
  pubnubStr: Joi.any().description(
    "in case driver is in booking need comma(,) separated string which contains bid_custChn_status,.. Eg:1511786050048|slave_B39C056A-C6EC-44BC-8021-AD7FEAF9449F|14"
  ),
  appVersion: Joi.any().description("app version"),
  batteryPer: Joi.any().description("battery version"),
  locationCheck: Joi.any().description("is location is on or not 0- means off 1 -> on"),
  deviceType: Joi.number()
    .required()
    .integer()
    .min(1)
    .max(3)
    .description("1- IOS , 2- Android, 3-Web"),
  locationHeading: Joi.any().description("what is vehicle direction"),
  presenceTime: Joi.any().description("presence time interval"),
  driverId: Joi.string().description("driverId"),
  transit: Joi.number().description("1-If on booking & moving, 0-If not moving"),
  status: Joi.number()
    .required()
    .integer()
    .min(3)
    .max(4)
    .description("3- Online ,  4- Offline")
};

/** 
 * A module that exports update status API!
 * @exports validator
 * @exports handler
 */
module.exports = {
  handler,
  validator
};