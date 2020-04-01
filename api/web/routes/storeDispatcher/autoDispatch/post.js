"use strict";
const orders = require("../../../../models/orders");
const drivers = require("../../../../models/driver");
// const webSocket = require('../../../../library/websocket');
const rabbitMq = require("../../../../library/rabbitMq/rabbitMq");
const notifyi = require("../../../../library/mqttModule/mqtt");
const webSocket = require("../../../../library/websocket/websocket");
const error = require("../../../../locales"); // response messages based on language
const config = process.env;
const Joi = require("joi");
const logger = require("winston");
const moment = require("moment");
var managerTopics = require("../../../commonModels/managerTopics");
const Async = require("async");
const serverDispatcher = require("../../../../worker/handlers/serverDispatcher");
const bookingsUnassigned = require("../../../../models/bookingsUnassigned");
const bookingsAssigned = require("../../../../models/bookingsAssigned");
const customer = require("../../../../models/customer");
const redis = require("../../../../library/redis");
const client = redis.client;
/**
 * @function
 * @name handler
 * @return {object} Reply to the user.
 *
 */
const handler = (request, reply) => {
  orders.getOrder({
    orderId: request.payload.orderId
  }, "unassignOrders", (err, orderObj) => {
    if (err) return reply({
      message: request.i18n.__("genericErrMsg")["500"][request.headers.language]
    }).code(500);

    // insert booking id in RabbitMq
    var bookingData = {
      bid: request.payload.orderId
    };

    rabbitMq.sendToQueue(rabbitMq.queueNewBooking, bookingData, (err, doc) => { });

    orders.update({
      q: {
        orderId: request.payload.orderId
      },
      data: {
        unAssign: false,
        status: 40,
        inDispatch: true,
        statusMsg: request.i18n.__(request.i18n.__('bookingStatusMsg')['40s']),
        statusText: request.i18n.__(request.i18n.__('bookingStatusMsg')['40s'])
      }
    },
      "unassignOrders",
      (err, orderObj) => {
        orders.getOrder({
          orderId: request.payload.orderId
        }, "unassignOrders", (err, orderObj) => {
          managerTopics.sendToWebsocket(orderObj, 2, (err, res) => { });
          webSocket.publish("orderUpdates", orderObj, {
            qos: 2
          }, function (mqttErr, mqttRes) { });

          return reply({
            message: request.i18n.__("driverList")["200"],
            data: orderObj
          }).code(200);
        });
      }
    );
  });
};

const dispatchhandler = (request, reply) => {
  orders.getOrder(request.payload, "newOrder", (err, orderObj) => {

    if (orderObj.serviceType == 2 && orderObj.storeType != 5) {
      var updateObj = {
        $set: {
          status: 4,
          statusMsg: "Accepted",
          statusText: "Accepted",
          inDispatch: false
        },
        $push: {
          managerLogs: {
            managerId: "",
            managerName: "forced accept",
            actionType: 5,
            actionTime: moment().unix()
          }
        }
      };
      orders.findOneAndUpdate({
        q: {
          orderId: request.payload.orderId
        },
        data: updateObj
      },
        "newOrder",
        (err, updated) => {
          if (updated.value) {
            orders.insert(updated.value, "pickupOrders", (err, inserted) => { });
            // webSocket.publish('stafforderUpdate/' + updated.value.storeId + '', updated.value, { qos: 2 }, function (mqttErr, mqttRes) {
            // });
            managerTopics.sendToWebsocket(updated.value, 2, (err, res) => { });
          }
        }
      );

      orders.remove({
        orderId: request.payload.orderId
      }, "newOrder", function (err, removeObj) { });
      //send notifications to store and customer
    } else if (orderObj.serviceType == 2 && orderObj.storeType == 5) {
      var updateObj = {
        $set: {
          status: 4,
          statusMsg: "Pick Up Requested",
          statusText: "Pick Up Requested"
        },
        $push: {
          managerLogs: {
            managerId: "",
            managerName: "forced accept",
            actionType: 4,
            actionTime: moment().unix()
          }
        }
      };

      orders.findOneAndUpdate({
        q: {
          orderId: request.payload.orderId
        },
        data: updateObj
      },
        "newOrder",
        (err, updated) => {
          if (updated.value) {
            updated.value.inDispatch = true;
            updated.value.status = 40;
            updated.value.statusMsg = request.i18n.__(request.i18n.__('bookingStatusMsg')['40s']);
            updated.value.statusText = request.i18n.__(request.i18n.__('bookingStatusMsg')['40s']);
            orders.insert(updated.value, "unassignOrders", (err, inserted) => {
              var bookingData = {
                bid: request.payload.orderId
              };
              serverDispatcher.nowBooking(request.payload.orderId, function (err, bookingdata) { });
              orders.getOrder({
                orderId: request.payload.orderId
              }, "unassignOrders", (err, orderObj) => { });
            });
          }
          orders.remove({
            orderId: request.payload.orderId
          }, "newOrder", function (err, removeObj) { });
        }
      );
    } else {
      var updateObj = {
        $set: {
          status: 4,
          statusMsg: "Accepted By Store",
          statusText: "Order has been accepted by " + orderObj.storeName
        },
        $push: {
          managerLogs: {
            managerId: "",
            managerName: "forced accept",
            actionType: 4,
            actionTime: moment().unix()
          }
        }
      };

      orders.findOneAndUpdate({
        q: {
          orderId: request.payload.orderId
        },
        data: updateObj
      },
        "newOrder",
        (err, updated) => {
          if (updated.value) {
            updated.value.inDispatch = true;
            if (updated.value.forcedAccept == 1 && updated.value.autoDispatch == 1) {
              updated.value.visiableInAccept = false;
            }
            updated.value.status = 40;
            updated.value.statusMsg = request.i18n.__(request.i18n.__('bookingStatusMsg')['40s']);
            updated.value.statusText = request.i18n.__(request.i18n.__('bookingStatusMsg')['40s']);
            orders.insert(updated.value, "unassignOrders", (err, inserted) => {
              var bookingData = {
                bid: request.payload.orderId
              };
              serverDispatcher.nowBooking(request.payload.orderId, function (err, bookingdata) { });
              orders.getOrder({
                orderId: request.payload.orderId
              }, "unassignOrders", (err, orderObj) => {
                // webSocket.publish('stafforderUpdate/' + orderObj.storeId + '', orderObj, { qos: 2 }, function (mqttErr, mqttRes) {
                // });
                managerTopics.sendToWebsocket(orderObj, 2, (err, res) => { });
              });
            });
          }
          orders.remove({
            orderId: request.payload.orderId
          }, "newOrder", function (err, removeObj) { });
        }
      );
    }

    return reply({
      message: request.i18n.__("ordersList")["200"],
      data: {}
    }).code(200);
  });
};

// Remove from auto dispatch
const cancelAutoDispatchHandler = (req, reply) => {

  const dbErrResponse = {
    message: req.i18n.__("genericErrMsg")["500"],
    code: 500
  };
  let bookingdata = {};
  let condition = {
    orderId: parseFloat(req.payload.orderId)
  };
  const getBooking = data => {
    return new Promise((resolve, reject) => {
      bookingsUnassigned.SelectOne(condition, function (err, res) {
        if (err) {
          return reject(dbErrResponse);
        } else {
          bookingdata = res;
          return resolve(data);
        }
      });
    });
  };
  getBooking()
    .then(data => {

      bookingsUnassigned.Update(condition, {
        status: 40,
        statusMsg: req.i18n.__(req.i18n.__('bookingStatusMsg')['40s']),
        inDispatch: false

      },
        function (err, result1) {
          if (err) {
            return reply({
              message: req.i18n.__("genericErrMsg")["500"]
            }).code(500);
          } else {
            managerTopics.sendToWebsocket(bookingdata, 1, (err, res) => { });
            client.del('que_' + bookingdata.orderId, function (err, reply) { });
            client.del('bid_' + bookingdata.orderId, function (err, reply) { });
            client.setex("centralQue_" + bookingdata.orderId, bookingdata.CentralDispatchExpriryTime, moment().unix(), function (
              err,
              result
            ) { });
            return reply({
              message: req.i18n.__("genericErrMsg")["200"]
            }).code(200);
          }
        })
    })

};

/**
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
  orderId: Joi.number()
    .integer()
    .required()
    .description("orderId"),
  timestamp: Joi.number()
    .required()
    .description("timestamp")
};

const cancelAutoDispatchValidator = {
  orderId: Joi.number()
    .integer()
    .required()
    .description("orderId")
};

/**
 * A module that exports customer get cart handler, get cart validator!
 * @exports handler
 */
module.exports = {
  handler,
  validator,
  dispatchhandler,
  cancelAutoDispatchHandler,
  cancelAutoDispatchValidator
};