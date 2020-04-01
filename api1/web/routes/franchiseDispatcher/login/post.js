"use strict";
const config = process.env;
const Joi = require("joi");
const async = require("async");
const ObjectID = require("mongodb").ObjectID;
const moment = require("moment");
const Bcrypt = require("bcrypt"); //hashing module
const logger = require("winston");
const users = require("../../../../models/users");
const stores = require("../../../../models/stores");
const Auth = require("../../../middleware/authentication");
const notifyi = require("../../../../library/mqttModule/mqtt");
const notifications = require("../../../../library/fcm");

const appConfig = require("../../../../models/appConfig");
const city = require("../../../../models/cities");

const validator = {
  email: Joi.string()
    .email()
    .description("email")
    .allow(""),
  password: Joi.string()
    .required()
    .description("Password"),
  latitude: Joi.number()
    .allow("")
    .description("Latitude"),
  longitude: Joi.number()
    .allow("")
    .description("Longitude"),
  ipAddress: Joi.number()
    .allow("")
    .description("ipAddress"),
  deviceId: Joi.string()
    .allow("")
    .description("Device id"),
  deviceMake: Joi.string()
    .allow("")
    .description("Device Make"),
  deviceModel: Joi.string()
    .allow("")
    .description("Device model"),
  deviceType: Joi.number()
    .allow("")
    .integer()
    .min(1)
    .max(3)
    .description("1- IOS , 2- Android, 3- web"),
  deviceTime: Joi.number()
    .allow("")
    .description("1512465347"),
  appVersion: Joi.string()
    .allow("")
    .description("App version"),
  latitude: Joi.number()
    .allow("")
    .description("Latitude"),
  longitude: Joi.number()
    .allow("")
    .description("Longitude"),
  deviceOsVersion: Joi.string()
    .allow("")
    .description("deviceOsVersion")
    .allow(""),
  name: Joi.string()
    .allow("")
    .description("name")
    .allow(""),
  managerImage: Joi.string()
    .allow("")
    .description("managerImage")
    .allow("")
};

const handler = (req, reply) => {
  let authToken = "";
  let appConfigData = "";
  let cityDetails = {};
  let userDetails = {};

  console.log("req", JSON.stringify(req.payload))


  const checkUser = data => {

    return new Promise((resolve, reject) => {
      users.SelectOne({
        email: new RegExp("^" + req.payload.email + "$", "i"),
        status: {
          $in: [1, 2, 3]
        }
      },
        (err, res) => {
          if (err) {
            return reject({
              message: req.i18n.__("genericErrMsg")["500"],
              code: 500
            });
          } else if (res === null) {
            return reject({
              message: req.i18n.__("managerSignIn")["404"],
              code: 404
            });
          } else {
            let isPasswordValid = Bcrypt.compareSync(req.payload.password, res.password);

            if (!isPasswordValid) return reject({
              message: req.i18n.__("managerSignIn")["401"],
              code: 401
            });
            else {
              userDetails = res
              return resolve(res);
            }
          }
        }
      );
    });
  }; //get user
  const getCityDetails = data => {

    return new Promise((resolve, reject) => {
      city.readByCityId({
        'cities.cityId': new ObjectID(data.cityId)
      }, (cityErr, cityResponse) => {

        if (cityErr) {
          return reject({
            message: req.i18n.__("managerSignIn")["401"],
            code: 401
          });
        } else {

          cityDetails = cityResponse

          return resolve(userDetails);
        }


      })

    });
  };

  const responseUser = data => {



    return new Promise((resolve, reject) => {
      switch (data.userType) {
        case 0: //central

          return resolve({
            id: data._id,
            franchiseId: "0",
            cityId: data.cityId,
            storeId: "0",
            userType: data.userType,
            cityName: data.cityName,
            storeName: "",
            franchiseName: data.franchiseName || "",
            serviceZones: [],
            storeType: data.storeType ? data.storeType : 0,
            storeTypeMsg: data.storeTypeMsg ? data.storeTypeMsg : "",
            driverType: 1,
            name: data.name || "",
            deviceId: data.deviceId,
            fcmUserTopic: data.fcmUserTopic,
            dispatcherUserType: data.dispatcherUserType,
            isForcedAccept: 0,
            isAutoDispatch: 0,
            defaultBankAccount: cityDetails.cities[0].defaultExternalAccount ? cityDetails.cities[0].defaultExternalAccount.accountNumber : "",
            countryCode: data.countryCode ? data.countryCode : "",
            currency: cityDetails.cities[0].currency ? cityDetails.cities[0].currency : "",
            currencySymbol: cityDetails.cities[0].currencySymbol ? cityDetails.cities[0].currencySymbol : "",
            enableBankAccount: cityDetails.cities[0].bankAccountingLinking ? cityDetails.cities[0].bankAccountingLinking : 1,
            isPackageEnable: 0
          });
          break;
        case 1: //franchies
          let serviceZonesForStore = [];
          let driverType = 1;
          stores.readAll({
            franchiseId: data.franchiseId
          }, (err, storeBaseFran) => {
            if (err) {
              return resolve(data);
            } else if (storeBaseFran.length > 0) {
              storeBaseFran.forEach(element => {
                if (element.serviceZones && element.serviceZones.length > 0 && element.driverType == 1) {
                  driverType = 2;
                  serviceZonesForStore = serviceZonesForStore.concat(element.serviceZones);
                }
              });
              return resolve({
                id: data._id,
                franchiseId: data.franchiseId,
                cityId: data.cityId,
                storeId: "0",
                userType: data.userType,
                cityName: data.cityName,
                storeName: "",
                franchiseName: data.franchiseName || "",
                serviceZones: serviceZonesForStore || [],
                storeType: data.storeType ? data.storeType : 0,
                storeTypeMsg: data.storeTypeMsg ? data.storeTypeMsg : "",
                driverType: driverType,
                name: data.name || "",
                deviceId: data.deviceId,
                fcmUserTopic: data.fcmUserTopic,
                dispatcherUserType: data.dispatcherUserType || "",
                isForcedAccept: 0,
                isAutoDispatch: 0,
                defaultBankAccount: cityDetails.cities[0].defaultExternalAccount ? cityDetails.cities[0].defaultExternalAccount.accountNumber : "",
                countryCode: data.countryCode ? data.countryCode : "",
                currency: cityDetails.cities[0].currency ? cityDetails.cities[0].currency : "",
                currencySymbol: cityDetails.cities[0].currencySymbol ? cityDetails.cities[0].currencySymbol : "",
                enableBankAccount: cityDetails.cities[0].bankAccountingLinking ? cityDetails.cities[0].bankAccountingLinking : 1,
                isPackageEnable: 0
              });
            } else {
              return resolve({
                id: data._id,
                franchiseId: data.franchiseId,
                cityId: data.cityId,
                storeId: "0",
                userType: data.userType,
                cityName: data.cityName,
                storeName: "",
                franchiseName: data.franchiseName || "",
                serviceZones: serviceZonesForStore || [],
                storeType: data.storeType ? data.storeType : 0,
                storeTypeMsg: data.storeTypeMsg ? data.storeTypeMsg : "",
                driverType: driverType,
                name: data.name || "",
                deviceId: data.deviceId,
                fcmUserTopic: data.fcmUserTopic,
                dispatcherUserType: data.dispatcherUserType || "",
                isForcedAccept: 0,
                isAutoDispatch: 0,
                defaultBankAccount: cityDetails.cities[0].defaultExternalAccount ? cityDetails.cities[0].defaultExternalAccount.accountNumber : "",
                countryCode: data.countryCode ? data.countryCode : "",
                currency: cityDetails.cities[0].currency ? cityDetails.cities[0].currency : "",
                currencySymbol: cityDetails.cities[0].currencySymbol ? cityDetails.cities[0].currencySymbol : "",
                enableBankAccount: cityDetails.cities[0].bankAccountingLinking ? cityDetails.cities[0].bankAccountingLinking : 1,
                isPackageEnable: 0
              });
            }
          });
          break;
        case 2: //store
          stores.getOne({
            _id: new ObjectID(data.storeId)
          }, (err, storeData) => {
            if (err) {
              return resolve(data);
            } else {

              return resolve({
                id: data._id,
                franchiseId: storeData.franchiseId || "0",
                cityId: data.cityId,
                storeId: data.storeId,
                userType: data.userType,
                cityName: data.cityName,
                storeName: storeData.sName ? storeData.sName[req.headers.language] : "",
                franchiseName: data.franchiseName || "",
                serviceZones: storeData.serviceZones || [],
                storeType: storeData.storeType ? storeData.storeType : 0,
                storeTypeMsg: storeData.storeTypeMsg ? storeData.storeTypeMsg : "",
                driverType: storeData.driverType == 2 ? 2 : 1,
                name: data.name || "",
                deviceId: data.deviceId,
                fcmUserTopic: data.fcmUserTopic,
                dispatcherUserType: data.dispatcherUserType || "",
                isForcedAccept: storeData.forcedAccept == 1 ? 1 : 0,
                isAutoDispatch: storeData.autoDispatch == 1 ? 1 : 0,
                defaultBankAccount: cityDetails.cities[0].defaultExternalAccount ? cityDetails.cities[0].defaultExternalAccount.accountNumber : "",
                countryCode: data.countryCode ? data.countryCode : "",
                currency: cityDetails.cities[0].currency ? cityDetails.cities[0].currency : "",
                currencySymbol: cityDetails.cities[0].currencySymbol ? cityDetails.cities[0].currencySymbol : "",
                enableBankAccount: cityDetails.cities[0].bankAccountingLinking ? cityDetails.cities[0].bankAccountingLinking : 1,
                isPackageEnable: storeData.isPackageEnable ? storeData.isPackageEnable : 0
              });
            }
          });
          break;
        default:
          return reject({
            message: req.i18n.__("managerSignIn")["404"],
            code: 404
          });
      }
    });
  };
  const generateToken = data => {
    return new Promise((resolve, reject) => {
      authToken = Auth.SignJWT({
        userType: data.userType,
        _id: data.id.toString(),
        cityId: data.cityId,
        storeId: data.storeId,
        franchiseId: data.franchiseId,
        key: "acc",
        deviceId: data.deviceId
      },
        "dispatcher",
        config.accTokenExp
      ); //sign a new JWT
      data.authToken = authToken;
      return resolve(data);
    });
  }; //get customer
  const configData = data => {
    return new Promise((resolve, reject) => {
      appConfig.get({}, (err, appConfig) => {
        if (err) {
          return reject({
            message: req.i18n.__("genericErrMsg")["500"],
            code: 500
          });
        }
        appConfigData = appConfig;
        return resolve(true);
      });
    });
  };
  const logOutFromOtherDevice = data => {
    return new Promise((resolve, reject) => {
      if (data.deviceId && data.deviceId != req.payload.deviceId) {
        notifications.notifyFcmTopic({
          action: 12,
          usertype: 2,
          deviceType: data.mobileDevices ? data.mobileDevices.deviceType : 1,
          notification: "",
          msg: req.i18n.__(req.i18n.__('driverStatus')['sessionmsg']),
          fcmTopic: data.fcmUserTopic,
          title: req.i18n.__(req.i18n.__('driverStatus')['sessiontitle']),

          data: {
            deviceId: req.payload.deviceId
          }
        },
          () => { }
        ); // fcm event
        notifyi.notifyRealTime({
          listner: data.fcmUserTopic,
          message: {
            action: 12,
            message: "Session Expired",
            deviceId: req.payload.deviceId
          }
        }); // mqtt event
      }
      data.deviceId = req.payload.deviceId;
      return resolve(data);
    });
  };

  configData()
    .then(checkUser)
    .then(getCityDetails)
    .then(responseUser)
    .then(logOutFromOtherDevice)
    .then(generateToken)
    .then(data => {
      let fcmUserTopic = "FCM-USER-" + data.id; //generate a new fcmManagerTopic on new login
      let fcmManagerTopic = "FCM-MANAGER-" + data.id + Math.floor(Math.random() * 899999 + 100000); //generate a new fcmManagerTopic on new login
      let fcmStoreTopic = "FCM-STORE-" + data.storeId; //generate a new fcmStoreTopic on new login
      let fcmCityTopic = "FCM-CITY-" + data.cityId; //generate a new fcmStoreTopic on new login
      // data.custGoogleMapKeys =
      //   typeof appConfigData.custGoogleMapKeys == "undefined" ? [] : appConfigData.custGoogleMapKeys;
      // data.custGooglePlaceKeys =
      //   typeof appConfigData.custGooglePlaceKeys == "undefined" ? [] : appConfigData.custGooglePlaceKeys;
      data.googleMapKey =
        typeof appConfigData.keyRotationArray == "undefined" ?
          "N/A" :
          appConfigData.keyRotationArray[appConfigData.currentKeyIndex].currentKey;
      data.googleMapKeyMqtt = "googleMapKey";
      data.fcmUserTopic = fcmUserTopic;
      data.fcmManagerTopic = fcmManagerTopic;
      data.fcmStoreTopic = fcmStoreTopic;
      data.fcmTopic = fcmStoreTopic;
      data.fcmCityTopic = fcmCityTopic;
      data.scheduledBookingEnable = appConfigData.dispatch_settings.scheduledBookingsOnOFF ? appConfigData.dispatch_settings.scheduledBookingsOnOFF : 0;
      data.bufferTime = appConfigData.dispatch_settings.laterBookingBufferHour ? (appConfigData.dispatch_settings.laterBookingBufferHour) * 60 + appConfigData.dispatch_settings.laterBookingBufferMinute : 30;
      data.status = 2;
      data.deviceType = req.payload.deviceType
      data.deviceOsVersion = req.payload.deviceOsVersion
      data.appVersion = req.payload.appVersion
      data.deviceMake = req.payload.deviceMake
      data.deviceModel = req.payload.deviceModel
      updateLogs(data.id, data, () => { }); //asynchronously update the login status
      return reply({
        message: req.i18n.__("genericErrMsg")["200"],
        data: data
      }).code(200);
    })
    .catch(e => {
      logger.error("Customer getBooking API error =>", e);
      return reply({
        message: e.message
      }).code(e.code);
    });
};

/**
 * @function
 * @name updateLogs
 * @param {string} id - manager id.
 * @param {string} userType - manager
 * @param {object} data - data coming from req.payload
 */
function updateLogs(id, data, callback) {
  data.id = id.toString();

  users.updateDeviceLog(data, (err, result) => {
    if (err) {
      logger.error("Error occurred during manager signin (updateDeviceLog): " + JSON.stringify(err));
      return callback("Error updating manager signin status");
    }
    return callback(null, result.lastErrorObject.updatedExisting);
  });
} //update the login status of the manager, logs out from all the other devices

module.exports = {
  handler,
  validator
};