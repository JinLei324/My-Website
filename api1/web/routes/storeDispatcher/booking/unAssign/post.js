"use strict";

const Auth = require("../../../../middleware/authentication");
//const i18n = require('../../../../../locales/locales');

// response messages based on language
const config = process.env;
const Bcrypt = require("bcrypt"); //hashing module
const Joi = require("joi");
const async = require("async");
const ObjectID = require("mongodb").ObjectID;
const moment = require("moment");
const logger = require("winston");
var notifications = require("../../../../../library/fcm");
const bookingsUnassigned = require("../../../../../models/bookingsUnassigned");
const customer = require("../../../../../models/customer");
const bookingsAssigned = require("../../../../../models/bookingsAssigned");
const drivers = require("../../../../../models/driver");
const redis = require("../../../../../library/redis");
const notifyi = require("../../../../../library/mqttModule/mqtt");
let client = redis.client;
const webSocket = require("../../../../../library/websocket/websocket");
var dispatchLogs = require("../../../../../models/dispatchLogs");
// const error = require('../../../../../locales/');

var managerTopics = require("../../../../commonModels/managerTopics");

const payload = Joi.object({
  orderId: Joi.number()
    .integer()
    .required()
    .description("booking id")
}).required();

const APIHandler = (req, reply) => {
  const dbErrResponse = { message: req.i18n.__("genericErrMsg")["500"], code: 500 };
  let bookingdata = {};
  let customerData = {};
  let providerData = {};
  let condition = {
    orderId: parseFloat(req.payload.orderId)
  };
  const getBooking = data => {
    return new Promise((resolve, reject) => {
      bookingsAssigned.SelectOne(condition, function (err, res) {
        if (err) {
          return reject(dbErrResponse);
        } else {
          bookingdata = res;
          return resolve(data);
        }
      });
    });
  };
  let getCustomerData = () => {
    return new Promise((resolve, reject) => {
      customer.getOne({ _id: bookingdata.customerDetails ? new ObjectID(bookingdata.customerDetails.customerId) : "" }, (err, customer) => {
        if (err) {
          reject(dbErrResponse);
        } else if (customer) {
          customerData = customer;
          resolve(true);
        } else {
          logger.error("customer not found ");
          reject("error");
        }
      }
      );
    });
  };
  const getProvider = data => {
    return new Promise((resolve, reject) => {
      drivers.SelectOne({ _id: new ObjectID(bookingdata.driverId) }, (err, res) => {
        if (err) {
          return reject(dbErrResponse);
        } else {
          providerData = res;
          return resolve(data);
        }
      });
    });
  };

  getBooking()
    .then(getCustomerData)
    .then(getProvider)
    .then(data => {
      bookingdata.inDispatch = false;
      bookingdata.statusMsg = req.i18n.__(req.i18n.__('bookingStatusMsg')['21']);
      bookingdata.unAssign = true;
      bookingdata.status = 21;
      bookingdata.driverId = "";
      bookingdata.driverDetails = {};
      let dispatcherData = {
        status: 21,
        statusMsg: req.i18n.__(req.i18n.__('bookingStatusMsg')['21']),
        bid: bookingdata.orderId,
        orderId: bookingdata.orderId,
        storeId: bookingdata.storeId // yunus
      };
      notifyi.notifyRealTime({ listner: customerData.mqttTopic, message: dispatcherData });

      notifications.notifyFcmTopic(
        {
          action: 11,
          usertype: 1,
          deviceType: customerData.mobileDevices ? customerData.mobileDevices.deviceType : 1,
          notification: "",
          status: 21,
          statusMsg: req.i18n.__(req.i18n.__('bookingStatusMsg')['21']),
          msg: req.i18n.__(req.i18n.__('bookingStatusMsg')['21']),
          fcmTopic: customerData.fcmTopic || "",
          title: req.i18n.__(req.i18n.__('bookingStatusTitle')['21']),
          data: dispatcherData
        },
        () => { }
      );
      // let dispatcherData = {
      //     status: 104,
      //     bid: Number(booking[1]),
      //     name: '',
      //     email: ''
      // };
      // notifyi.notifyRealTime({ 'listner': 'bookingChn', message: dispatcherData });
      let dispatchMsg = {
        action: 10,
        statusMsg: req.i18n.__(req.i18n.__('bookingStatusMsg')['21'])
      };

      if (providerData.listner && providerData.listner != undefined && providerData.listner != "undefined") {
        notifyi.notifyRealTime({ listner: providerData.listner, message: dispatchMsg });
      }
      drivers.FINDONEANDUPDATE(
        {
          query: { _id: new ObjectID(providerData._id.toString()) },
          data: {
            $inc: { currentBookingsCount: -1 },
            $pull: { currentBookings: { bid: bookingdata.orderId } }
          }
        },
        (err, result) => { }
      );
      // console.log(" providerData.pushToken", JSON.stringify(providerData))
      notifications.notifyFcmTopic(
        {
          action: 10,
          usertype: 1,
          deviceType: providerData.mobileDevices ? providerData.mobileDevices.deviceType : 1,
          notification: "",
          statusMsg: req.i18n.__(req.i18n.__('bookingStatusMsg')['21']),
          msg: req.i18n.__(req.i18n.__('bookingStatusMsg')['21']),
          fcmTopic: providerData.pushToken,
          title: req.i18n.__(req.i18n.__('bookingStatusTitle')['21']),
          data: { bookingData: dispatchMsg }
        },
        () => { }
      );
      bookingsUnassigned
        .createNewBooking(bookingdata)
        .then(result => {
          bookingsAssigned.Remove(condition, function (err, res) {
            if (err) {
              return reply({ message: req.i18n.__("genericErrMsg")["500"] }).code(500);
            } else {
              webSocket.publish("orderUpdates", bookingdata, { qos: 2 }, function (mqttErr, mqttRes) { });
              managerTopics.sendToWebsocket(bookingdata, 2, (err, res) => { });
              return reply({ message: req.i18n.__("genericErrMsg")["200"] }).code(200);
            }
          });
        })
        .catch(e => {
          return reply({ message: req.i18n.__("genericErrMsg")["500"] }).code(500);
        });
    })
    .catch(e => {
      return reply({ message: req.i18n.__("genericErrMsg")["500"] }).code(500);
    });
};

// let lang = providerErrorMsg['langaugeId'];

const responseCode = {
  //     status: {
  //         500: { message: providerErrorMsg['genericErrMsg']['500'][lang] },
  //         200: { message: providerErrorMsg['postBookingAck']['200'][lang] },
  //         400: { message: providerErrorMsg['postBookingAck']['400'][lang] },
  //         404: { message: providerErrorMsg['postBookingAck']['404'][lang] },
  //     }
}; //swagger response code

module.exports = { payload, APIHandler, responseCode };
