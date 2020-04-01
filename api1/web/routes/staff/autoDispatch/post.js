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

/**
 * @function
 * @name handler
 * @return {object} Reply to the user.
 *
 */
const handler = (request, reply) => {
  orders.getOrder({ orderId: request.payload.orderId }, "unassignOrders", (err, orderObj) => {
    if (err) return reply({ message: request.i18n.__("genericErrMsg")["500"] }).code(500);

    // insert booking id in RabbitMq
    var bookingData = {
      bid: request.payload.orderId
    };

    rabbitMq.sendToQueue(rabbitMq.queueNewBooking, bookingData, (err, doc) => { });

    orders.update(
      {
        q: { orderId: request.payload.orderId },
        data: {
          inDispatch: true,
          status: 40,
          statusMsg: request.i18n.__(request.i18n.__('bookingStatusMsg')['40s']),
          statusText: request.i18n.__(request.i18n.__('bookingStatusMsg')['40s'])
        }
      },
      "unassignOrders",
      (err, orderObj) => {
        orders.getOrder({ orderId: request.payload.orderId }, "unassignOrders", (err, orderObj) => {
          //    webSocket.publish('stafforderUpdates', orderObj, { qos: 2 }, function (mqttErr, mqttRes) {
          //     }); // yunus
          if (orderObj) {
            webSocket.publish("orderUpdates", orderObj, { qos: 2 }, function (mqttErr, mqttRes) { });
            // webSocket.publish('stafforderUpdate/' + orderObj.storeId + '', orderObj, { qos: 2 }, function (mqttErr, mqttRes) {
            // });
            managerTopics.sendToWebsocket(orderObj, 2, (err, res) => { });
          }
        });
      }
    );

    return reply({ message: request.i18n.__("driverList")["200"], data: "success" }).code(200);
  });
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
  timestamp: Joi.string()
    .required()
    .description("timestamp")
};

/**
 * A module that exports customer get cart handler, get cart validator!
 * @exports handler
 */
module.exports = { handler, validator };
