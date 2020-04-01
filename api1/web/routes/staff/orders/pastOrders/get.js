"use strict";
const orders = require("../../../../../models/orders");
// const webSocket = require('../../../../library/websocket');
const webSocket = require("../../../../../library/websocket/websocket");
const error = require("../../../../../statusMessages/responseMessage"); // response messages based on language
const config = process.env;
const Joi = require("joi");
const logger = require("winston");
const Async = require("async");

/**
 * @function
 * @name handler
 * @return {object} Reply to the user.
 */
const handler = (request, reply) => {
  let fromDate = request.params.fromDate + " 00:00:00";
  let toDate = request.params.toDate + " 23:59:59";

  // logger.warn(new Date(fromDate).getTime())
  // logger.warn(new Date(toDate).getTime())

  var filter = {};
  var timeStampFilter = {};
  if (fromDate && toDate) {
    filter = {
      $gte: fromDate,
      $lte: new Date(toDate).toISOString()
    };
    timeStampFilter = {
      $gte: new Date(fromDate).getTime() / 1000,
      $lte: new Date(toDate).getTime() / 1000
    };
  }

  if (fromDate && !toDate) {
    filter = {
      $gte: fromDate,
      $lte: new Date().toISOString()
    };
    timeStampFilter = {
      $gte: new Date(fromDate).getTime() / 1000,
      $lte: new Date().getTime() / 1000
    };
  }

  if (!fromDate && toDate) {
    filter = { $lte: new Date(toDate).toISOString() };
    timeStampFilter = {
      $lte: new Date(toDate).getTime() / 1000
    };
  }

  let pageIndex = request.params.index;
  let limit = 20;
  let skip = pageIndex * limit;

  let cond = {
    status: { $in: [2, 3, 7, 9, 15, 16, 20] }
  };
  if (parseInt(request.params.storeId) != 0) {
    cond["storeId"] = request.params.storeId;
  }

  if (parseInt(request.params.cityId) != 0) {
    cond["cityId"] = request.params.cityId;
  }

  if (request.params.search != "0" && request.params.search != "") {
    cond["$or"] = [
      { "orderIdString": { $regex: request.params.search, $options: "i" } },
      { "customerDetails.name": { $regex: request.params.search, $options: "i" } },
      { "customerDetails.email": { $regex: request.params.search, $options: "i" } },
      { "customerDetails.mobile": { $regex: request.params.search, $options: "i" } }
    ];
  }

  if (request.params.fromDate != "0" && request.params.toDate != "0") {
    cond["bookingDateTimeStamp"] = timeStampFilter;
  }
  Async.series(
    [
      function (cb) {
        orders.getAllCompleted(
          { q: cond, options: { skip: skip, limit: limit } },
          "completedOrders",
          (err, completedOrdersObj) => {
            cb(null, completedOrdersObj);
          }
        );
      },
      function (cb) {
        orders.count(cond, "completedOrders", (err, newOrderCount) => {
          cb(null, newOrderCount);
        });
      }
    ],
    (err, result) => {
      if (err) return reply({ message: request.i18n.__("genericErrMsg")["500"] }).code(500);

      // webSocket.publish('storePastOrders/' + request.params.storeId, {data : { pastOrders: result[0], pastOrdersCount: result[1] } }, { qos: 2 }, (mqttErr, mqttRes) => {
      // });
      return reply({
        message: request.i18n.__("ordersList")["200"],
        data: { pastOrders: result[0], pastOrdersCount: result[1] }
      }).code(200);
    }
  );
};

/**
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
  cityId: Joi.string()
    .required()
    .description("cityId"),
  storeId: Joi.string()
    .required()
    .description("storeId"),
  index: Joi.number()
    .integer()
    .required()
    .description("pageIndex"),
  fromDate: Joi.string()
    .required()
    .description("fromDate"),
  toDate: Joi.string()
    .required()
    .description("toDate"),
  search: Joi.string()
    .required()
    .description("serach")
};

/**
 * A module that exports customer get cart handler, get cart validator!
 * @exports handler
 */
module.exports = { handler, validator };
