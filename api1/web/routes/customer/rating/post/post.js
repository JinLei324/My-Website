"use strict";
const customer = require("../../../../../models/customer");
const completedOrders = require("../../../../../models/completedOrders");
const stores = require("../../../../../models/stores");
const storeElastic = require("../../../../../models/storeElastic");
const driver = require("../../../../../models/driver");
const error = require("../../../../../statusMessages/responseMessage"); // response messages based on language
const config = process.env;
const ObjectID = require("mongodb").ObjectID;
const moment = require("moment");
const logger = require("winston");
const superagent = require("superagent");
const notifications = require("../../../../../library/fcm");
const webSocket = require("../../../../../library/websocket/websocket");
const email = require("../../../../commonModels/email/email");
const managerTopics = require("../../../../commonModels/managerTopics");
const notifyi = require("../../../../../library/mqttModule");
/**
 * @function
 * @name logoutHandler
 * @return {object} Reply to the user.
 */
const handler = (request, reply) => {
  let driverData = {};

  // customer.isExistsWithId({ _id: new ObjectID(request.payload.customerId) }, (err, res) => {
  //     if (err) {
  //         logger.error('Error occurred during customer customer update transaction python (isExistsWithId): ' + JSON.stringify(err));
  //         return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
  //     } else if (res) {
  request.payload.userId = request.auth.credentials._id.toString();

  let driverRatValue = parseFloat(0);
  request.payload.driverRatLogs = [];
  let orderRatValue = parseFloat(0);
  request.payload.orderRatLogs = [];
  request.payload.avdriverRating = 0;
  request.payload.avOrderRating = 0;
  if (request.payload.review) {
    for (let i = 0; i < request.payload.review.length; i++) {
      if (request.payload.review[i].associated == 1) {
        // driver
        driverRatValue += parseFloat(request.payload.review[i].rating);
        request.payload.driverRatLogs.push(request.payload.review[i]);
      }
      if (request.payload.review[i].associated == 2) {
        // order
        orderRatValue += parseFloat(request.payload.review[i].rating);
        request.payload.orderRatLogs.push(request.payload.review[i]);
      }
    }
  }

  request.payload.avdriverRating = parseFloat(driverRatValue) / parseInt(request.payload.driverRatLogs.length);
  request.payload.avOrderRating = parseFloat(orderRatValue) / parseInt(request.payload.orderRatLogs.length);
  request.payload.avOrderRating = request.payload.avOrderRating > 0 ? request.payload.avOrderRating : 0;
  request.payload.avdriverRating = request.payload.avdriverRating > 0 ? request.payload.avdriverRating : 0;
  request.payload.tip = request.payload.tip ? parseFloat(request.payload.tip) : 0;

  completedOrders.patchRating(request.payload, (err, result) => {
    if (err) {
      logger.error("Error occurred during customer rating update  (patchRating): " + JSON.stringify(err));
      // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
      return reply({ message: request.i18n.__("genericErrMsg")["500"] }).code(500);
    } else if (result) {
      let finalAverageValue = 0;
      let orderCount = 0;
      let newAvgRatingValue = 0;
      let storeAverageRating = 0;
      // if (result.value && result.value.storeId.length == 24) {
      stores.isExistsWithId({ _id: result.value.storeId ? new ObjectID(result.value.storeId) : "" }, (err, store) => {
        if (store) {
          let newRating = result.value.reviewByCustomer ? result.value.reviewByCustomer.review : [];
          let newOrderValue = 0;
          for (let i = 0; i < newRating.length; i++) {
            newOrderValue += parseFloat(newRating[i].rating);
          }
          if (newRating.length > 0)
            newAvgRatingValue = newOrderValue / newRating.length;
          orderCount = store.orderCount ? store.orderCount : 0;
          storeAverageRating = store.averageRating ? store.averageRating : 0;
          finalAverageValue = (orderCount * storeAverageRating + newAvgRatingValue) / (orderCount + 1);
          orderCount = orderCount + 1;
          var updateStoreRatingElastic = {
            averageRating: parseFloat(finalAverageValue).toFixed(2),
            orderCount: orderCount
          };

          stores.patchRating(
            {
              _id: result.value.storeId ? new ObjectID(result.value.storeId) : "",
              finalAverageValue: parseFloat(finalAverageValue).toFixed(2),
              orderCount: orderCount,
              reviewLog: result.value.reviewByCustomer
            },
            (err, storeUpdate) => {
              storeElastic.Update(result.value.storeId.toString(), updateStoreRatingElastic, (err, resultelastic) => {
                storeElastic.UpdateWithPush(
                  result.value.storeId.toString(),
                  "reviewLogs",
                  result.value.reviewByCustomer,
                  (err, resultelasticPush) => {
                    if (err) {

                    }
                  }
                );
              });
            }
          );

          const read = newOrder => {
            return new Promise((resolve, reject) => {
              driver.isExistsWithId(
                { _id: result.value.driverDetails ? new ObjectID(result.value.driverDetails.driverId.toString()) : "" },
                (err, res) => {
                  driverData = res ? res : driverData;
                  return err ? reject(err) : resolve(driverData);
                }
              );
            });
          };
          read()
            .then(data => {
              let currentratng = driverData.averageRating ? parseFloat(driverData.averageRating) : 0;
              let currentratngCount = driverData.averageRatingCount ? driverData.averageRatingCount + 1 : 1;
              let totalVal = 0;
              totalVal =
                currentratng == 0
                  ? (request.payload.avdriverRating + currentratng) / 1
                  : (request.payload.avdriverRating + currentratng) / 2;
              totalVal = totalVal > 0 ? totalVal : 0;

              if (request.payload.avdriverRating > 0) {
                driver.patchRating(
                  {
                    _id: result.value.driverDetails ? new ObjectID(result.value.driverDetails.driverId.toString()) : "",
                    finalAverageValue: totalVal,
                    reviewLog: {
                      log: result.value.reviewByCustomer.toDriver,
                      userId: result.value.reviewByCustomer.userId,
                      reviewAt: result.value.reviewByCustomer.reviewAt,
                      reviewAtiso: result.value.reviewByCustomer.reviewAtiso
                    }
                  },
                  (err, storeUpdate) => {}
                );
              }

              return reply({ message: request.i18n.__("slaveUpdateProfile")["200"] }).code(200);
            })
            .catch(e => {
              logger.error("Error occurred place order (catch): " + JSON.stringify(e));
              // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[req.headers.language] }).code(500);
              return reply({ message: request.i18n.__("genericErrMsg")["500"] }).code(500);
            });
        }

        // return reply({ message: error['slaveUpdateProfile']['200'][request.headers.language] }).code(200);
      });
      // }
    } else {
      // return reply({ message: error['getData']['404'][request.headers.language] }).code(404);
      return reply({ message: request.i18n.__("getData")["404"] }).code(404);
    }
  });

  //   return reply({ message: error['slaveUpdateProfile']['200'] }).code(200);
  // } else
  //     return reply({ message: error['getData']['404'][request.headers.language] }).code(404);
  // });
};

/**
 * A module that exports customerSignup's handler!
 * @exports handler
 */
module.exports = { handler };
