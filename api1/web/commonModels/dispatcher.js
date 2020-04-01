"use strict";
const moment = require("moment");
const provider = require("../../models/driver");
const stores = require("../../models/stores");
const unassignOrders = require("../../models/bookingsUnassigned");
const bookings = require("../../models/orders");

const storeManagers = require("../../models/storeManagers");
const webSocket = require("../../library/websocket/websocket");
const ObjectID = require("mongodb").ObjectID;
const logger = require("winston");
var notifications = require("../../library/fcm");

//driver status update => dispatcher
const providerStatus = (dataArr, callback) => {
  const readProvider = data => {
    return new Promise((resolve, reject) => {
      provider.isExistsWithId({ _id: new ObjectID(dataArr._id) }, (err, res) => {
        return err ? reject(err) : resolve(res);
      });
    });
  };
  const responseInWebSockt = data => {
    let arraytoPush = [];
    // logger.warn('location providerStatus websocket');
    return new Promise((resolve, reject) => {
      var proData = {
        _id: data._id ? data._id.toString() : "",
        driverId: data._id ? data._id.toString() : "",
        a: 5,
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        image: data.profilePic,
        status: dataArr.status == 3 ? 3 : data.status,
        email: data.email,
        lastActive: data.mobileDevices.lastLogin, // before lastTs
        lastOnline: moment().unix() - data.mobileDevices.lastLogin,
        serverTime: moment().unix(),
        name: data.firstName || "" + " " + data.lastName || "",
        lastName: data.lastName || "",
        firstName: data.firstName || "",
        appversion: data.mobileDevices.appVersion || "",
        batteryPercentage: data.batteryPer || "",
        batteryPer: data.batteryPer || "",
        countryCode: data.countryCode,
        phone: data.countryCode + data.mobile || "",
        locationCheck: data.locationCheck || "",
        deviceType: data.mobileDevices.deviceType || "",
        tasks: 0,
        serviceZones: data.serviceZones || [],
        driverType: data.driverType,
        destinationName: "driverStatus",
        storeId: data.storeId
      };
      if (data.status == 9) {
        //--------------send silent push notification to Driver
        notifications.notifyFcmTopic(
          {
            fcmTopic: data.pushToken || "",
            action: 506,
            pushType: 1,
            title: "",
            msg: "",
            deviceType: data.mobileDevices.deviceType
          },
          (e, r) => { }
        );
      }
      /**
       * for central dispatcher
       * topic => dispatcher/cityId/franchesId/stroeId,
       */
      arraytoPush.push("AllDriverLocations/" + data._id.toString());
      if (data.driverType == 1) {
        //freelancer
        storeManagers.getAll({ cityId: data.cityId.toString(), status: 2, userType: 0 }, (err, cityManager) => {
          if (err) {
            logger.error("Error while getting storemanager topics   (getAll): " + JSON.stringify(err));
          }
          if (cityManager.length > 0) {
            for (let k = 0; k < cityManager.length; k++) {
              arraytoPush.push("cityManager/" + data.cityId + "/" + cityManager[k]._id.toString());
            }
          }
          // logger.warn("sending to mangers mqttManagerTopic " + arraytoPush);
          webSocket.publish(arraytoPush, proData, { qos: 2 }, (mqttErr, mqttRes) => {
            return mqttErr ? reject(mqttErr) : resolve(mqttRes);
          });
        });
      } else {
        stores.getOne({ _id: new ObjectID(data.storeId) }, (err, res) => {
          if (res) {
            storeManagers.getAll({ storeId: data.storeId.toString(), status: 2 }, (err, storeManager) => {
              if (err) {
                logger.error("Error while getting storemanager topics   (getAll): " + JSON.stringify(err));
              }
              if (storeManager.length > 0) {
                for (let s = 0; s < storeManager.length; s++) {
                  arraytoPush.push(
                    "storeManager/" +
                    data.cityId +
                    "/" +
                    (res.franchiseId || 0) +
                    "/" +
                    data.storeId.toString() +
                    "/" +
                    storeManager[s]._id.toString()
                  );
                }
              }

              storeManagers.getAll({ cityId: data.cityId.toString(), status: 2, userType: 0 }, (err, cityManager) => {
                if (err) {
                  logger.error("Error while getting storemanager topics   (getAll): " + JSON.stringify(err));
                }
                if (cityManager.length > 0) {
                  for (let k = 0; k < cityManager.length; k++) {
                    arraytoPush.push("cityManager/" + data.cityId + "/" + cityManager[k]._id.toString());
                  }
                }
                // logger.warn("sending to mangers mqttManagerTopic " + arraytoPush);
                webSocket.publish(arraytoPush, proData, { qos: 2 }, (mqttErr, mqttRes) => {
                  return mqttErr ? reject(mqttErr) : resolve(mqttRes);
                });
              });
            });
          } else {
            return resolve(true);
          }
        });
      }
    });
  };
  readProvider()
    // .then(readBooking)
    .then(responseInWebSockt)
    .then(data => {
      return callback(data);
    })
    .catch(e => {
      logger.error("Provider post status update API error =>", e);
      return callback(e);
    });
};

//driver location update => dispatcher
const liveTrack = (dataArr, callback) => {
  let arraytoPush = [];
  const readProvider = data => {
    return new Promise((resolve, reject) => {
      provider.isExistsWithId({ _id: new ObjectID(dataArr._id) }, (err, res) => {
        return err ? reject(err) : resolve(res);
      });
    });
  };
  const responseliveTrackWebSockt = data => {
    //   logger.warn('location liveTrack websocket');
    return new Promise((resolve, reject) => {
      var proData = {
        _id: data._id ? data._id.toString() : "",
        driverId: data._id ? data._id.toString() : "",
        a: 5,
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        image: data.profilePic,
        status: data.status,
        email: data.email,
        lastActive: data.mobileDevices.lastLogin, // before lastTs
        lastOnline: moment().unix() - data.mobileDevices.lastLogin,
        serverTime: moment().unix(),
        name: data.firstName || "" + " " + data.lastName || "",
        lastName: data.lastName || "",
        firstName: data.firstName || "",
        appversion: data.mobileDevices.appVersion || "",
        batteryPercentage: data.batteryPer || "",
        batteryPer: data.batteryPer || "",
        phone: data.countryCode + data.mobile || "",
        countryCode: data.countryCode,
        locationCheck: data.locationCheck || "",
        deviceType: data.mobileDevices.deviceType || "",
        tasks: 0,
        serviceZones: data.serviceZones || [],
        driverType: data.driverType,
        destinationName: "driverLocation",
        storeId: data.storeId
      };
      arraytoPush.push("AllDriverLocations/" + data._id.toString());
      if (data.driverType == 1) {
        //freelancer
        // arraytoPush.push("dispatcher/freelancer/" + data.cityId);
        storeManagers.getAll({ cityId: data.cityId.toString(), status: 2, userType: 0 }, (err, cityManager) => {
          if (err) {
            logger.error("Error while getting storemanager topics   (getAll): " + JSON.stringify(err));
          }
          if (cityManager.length > 0) {
            for (let k = 0; k < cityManager.length; k++) {
              arraytoPush.push("cityManager/" + data.cityId + "/" + cityManager[k]._id.toString());
            }
          }
          // logger.warn("sending to mangers mqttManagerTopic " + arraytoPush);
          webSocket.publish(arraytoPush, proData, { qos: 2 }, (mqttErr, mqttRes) => {
            return mqttErr ? reject(mqttErr) : resolve(mqttRes);
          });
        });
      } else {
        stores.getOne({ _id: new ObjectID(data.storeId) }, (err, res) => {
          if (res) {
            storeManagers.getAll({ storeId: data.storeId.toString(), status: 2 }, (err, storeManager) => {
              if (err) {
                logger.error("Error while getting storemanager topics   (getAll): " + JSON.stringify(err));
              }
              if (storeManager.length > 0) {
                for (let s = 0; s < storeManager.length; s++) {
                  arraytoPush.push(
                    "storeManager/" +
                    data.cityId +
                    "/" +
                    (res.franchiseId || 0) +
                    "/" +
                    data.storeId.toString() +
                    "/" +
                    storeManager[s]._id.toString()
                  );
                }
              }

              storeManagers.getAll({ cityId: data.cityId.toString(), status: 2, userType: 0 }, (err, cityManager) => {
                if (err) {
                  logger.error("Error while getting storemanager topics   (getAll): " + JSON.stringify(err));
                }
                if (cityManager.length > 0) {
                  for (let k = 0; k < cityManager.length; k++) {
                    arraytoPush.push("cityManager/" + data.cityId + "/" + cityManager[k]._id.toString());
                  }
                }
                // logger.warn("sending to mangers mqttManagerTopic " + arraytoPush);
                webSocket.publish(arraytoPush, proData, { qos: 0 }, (mqttErr, mqttRes) => {
                  return mqttErr ? reject(mqttErr) : resolve(mqttRes);
                });
              });
            });
          } else {
            return resolve(true);
          }
        });
      }
    });
  };
  readProvider()
    .then(responseliveTrackWebSockt)
    .then(data => {
      return callback(data);
    })
    .catch(e => {
      logger.error("Provider post location update  API error =>", e);
      return callback(e);
    });
};

module.exports = {
  providerStatus,
  liveTrack
};
