"use strict";

const Joi = require("joi");
const Async = require("async");
const moment = require("moment");
const logger = require("winston");
const superagent = require("superagent");
const ObjectID = require("mongodb").ObjectID;
const redis = require("../../../../library/redis");
let client = redis.client;
const orders = require("../../../../models/orders");
const order = require("../../../../models/order");
const notifications = require("../../../../library/fcm");
const manager = require("../../../../models/storeManagers");
const franchiseManagers = require("../../../../models/franchiseManagers");
const wallet = require("../../../commonModels/wallet/wallet");
const notifyi = require("../../../../library/mqttModule/mqtt");
const common = require("../../../commonModels/orderAnalytics");
const error = require("../../../../statusMessages/responseMessage");
const managerTopics = require("../../../commonModels/managerTopics");
const webSocket = require("../../../../library/websocket/websocket");
const orderAnalytics = require("../../../commonModels/orderAnalytics");
const accounting = require("../../../commonModels/accounting/accounting");
const users = require("../../../../models/users");

const campaignAndreferral = require("../../campaignAndreferral/promoCode/post");

const config = process.env;
const validator = {
  status: Joi.number()
    .integer()
    .required()
    .description(
      "status  2 - managerCancel, 3 - managerReject, 4 - managerAccept, 5 - orderReady, 6 - orderPicked, 7 - orderCompleted  "
    ),
  timestamp: Joi.number()
    .required()
    .description("timestamp"),
  orderId: Joi.number()
    .integer()
    .required()
    .description("orderId"),
  reason: Joi.string().description("if cancel order need to give reason")
};
/** salesforce
 * @library
 * @author Umesh Beti
 */
const salesforce = require("../../../../library/salesforce");

/*salesforce*/
/**
 * @function
 * @name handler
 * @return {object} Reply to the user.
 * @name status (1-new, 2 - managerCancel, 3 - managerReject, 4 - managerAccept, 5 - orderReady, 6 - orderPicked, 7 - orderCompleted )
 */
const handler = (request, reply) => {

  let finalData;
  let managerObj;
  request.payload.managerId = request.auth.credentials._id;
  Async.series(
    [
      function (cb) {
        //getuser data
        users.SelectOne({ _id: new ObjectID(request.auth.credentials._id) }, (err, res) => {
          if (err) return reply({ message: request.i18n.__("genericErrMsg")["500"] }).code(500);
          // request.payload.managerName = res.name;
          managerObj = res;
          cb(null);
        });
      },
      function (cb) {
        switch (request.payload.status) {
          case 2:
          case 3:
            request.payload.statusMsg = request.payload.status == 2 ? request.i18n.__(request.i18n.__('bookingStatusTitle')['2']) : request.i18n.__(request.i18n.__('bookingStatusTitle')['3']);
            request.payload.statusText =
              request.payload.status == 2
                ? request.i18n.__(request.i18n.__('bookingStatusTitle')['2'])
                : request.i18n.__(request.i18n.__('bookingStatusTitle')['3']);
            orders.orderCancel(request.payload, "newOrder", (err, newOrdersObj) => {
              cb(null, "done");
            });
            client.get("storeAcceptExpire_" + request.payload.orderId, function (err, object) {
              if (object == null) {
              } else {
                client.del("storeAcceptExpire_" + request.payload.orderId, function (err, reply) { });
              }
            });
            break;

          case 4:
            logger.info("case 4,order status");
            request.payload.statusMsg = request.i18n.__(request.i18n.__('bookingStatusTitle')['4']);
            request.payload.statusText = request.i18n.__(request.i18n.__('bookingStatusTitle')['4']);

            orders.orderStatus(request.payload, "newOrder", (err, newOrdersObj) => {

              /* Salesfor @umesh Beti */
              var authData = salesforce.get();
              var DataToSalesforce = {
                orderId: request.payload.orderId,
                managerAccept: 4,
                orderStatus: "Accepted"
              };
              if (authData) {
                superagent
                  .patch(authData.instanceUrl + "/services/apexrest/delivx/NewOrder")
                  .send(DataToSalesforce) // sends a JSON post body
                  .set("Accept", "application/json")
                  .set("Authorization", "Bearer " + authData.accessToken)
                  .end((err, res) => {
                    if (err) {

                    } else {
                      logger.info("Send To Salesforce Success");
                    }
                  });
              }
              /* Salesfor @umesh Beti */
              cb(null, "done");
            });
            break;

          case 8:
            request.payload.statusMsg = "Order ready By Store";
            request.payload.statusText = "Order has been made ready by store/restaurant";
            orders.orderStatus(request.payload, "orderAccepted", (err, newOrdersObj) => {
              cb(null, "done");
            });
            break;

          case 5:
          case 6:
          case 7:
            if (request.payload.status == 5) {
              request.payload.statusMsg = request.i18n.__(request.i18n.__('bookingStatusTitle')['5']);
              request.payload.statusText = request.i18n.__(request.i18n.__('bookingStatusTitle')['5']);
            }

            if (request.payload.status == 6) {
              request.payload.statusMsg = request.i18n.__(request.i18n.__('bookingStatusTitle')['6']);
              request.payload.statusText = request.i18n.__(request.i18n.__('bookingStatusTitle')['6']);
            }

            if (request.payload.status == 7) {
              request.payload.statusMsg = request.i18n.__(request.i18n.__('bookingStatusTitle')['7']);
              request.payload.statusText = request.i18n.__(request.i18n.__('bookingStatusTitle')['7']);
            }

            orders.orderStatus(request.payload, "pickupOrders", (err, newOrdersObj) => {
              cb(null, "done");
            });
            break;

          case 25:

            request.payload.statusMsg = request.payload.status == 25 ? request.i18n.__(request.i18n.__('bookingStatusTitle')['25']) : "";
            orders.orderStatus(request.payload, "unassignOrders", (err, progressOrdersObj) => {
              cb(null, "done");
            });
            break;

          default:
            cb(null, "done");
            break;
        }
      },
      function (cb) {
        switch (request.payload.status) {
          case 2:
          case 3:
            orders.getOrder(request.payload, "newOrder", (err, orderObj) => {
              // common.unlockPromoCode(orderObj);
              if (
                orderObj.claimData &&
                Object.keys(orderObj.claimData).length !== 0 &&
                orderObj.claimData != null &&
                orderObj.claimData.claimId != ""
              ) {
                campaignAndreferral.unlockCouponHandler({ claimId: orderObj.claimData.claimId }, (err, res) => { });
              }
              delete orderObj._id;
              orders.insert(orderObj, "completedOrders", (err, resultObj) => {
                finalData = resultObj.ops[0];

                //send message to dispatcher
                // webSocket.publish('orderUpdates', resultObj.ops[0], { qos: 2 }, function (mqttErr, mqttRes) {
                // });

                webSocket.publish("adminOrderUpdates", resultObj.ops[0], { qos: 2 }, function (mqttErr, mqttRes) { });

                sendNotification(orderObj);
                sendNotificationManager(managerObj, request.payload.status, request.payload.orderId, orderObj);

                orders.remove({ orderId: request.payload.orderId }, "newOrder", function (err, removeObj) {
                  cb(null, "done");
                });
              });
            });
            break;

          case 4: 
            logger.info("case 4, inserting orderAccepted");
            orders.getOrder(request.payload, "newOrder", (err, orderObj) => {
              orders.insert(orderObj, "orderAccepted", (err, resultObj) => {
                finalData = resultObj.ops[0];
                webSocket.publish("adminOrderUpdates", resultObj.ops[0], { qos: 2 }, function (mqttErr, mqttRes) { });
                sendNotification(orderObj);
                sendNotificationManager(managerObj, request.payload.status, request.payload.orderId, orderObj);
                orders.remove({ orderId: request.payload.orderId }, "newOrder", function (err, removeObj) {
                  cb(null, "done");
                });
              });
            });
            break;
          case 8:
            orders.getOrder(request.payload, "orderAccepted", (err, orderObj) => {
              logger.info("orderObj from orderAccepted" + JSON.stringify(orderObj));
              if (orderObj.serviceType == 2) {
                orders.insert(orderObj, "pickupOrders", (err, resultObj) => {
                  finalData = resultObj.ops[0];

                  // webSocket.publish('orderUpdates', resultObj.ops[0], { qos: 2 }, function (mqttErr, mqttRes) {
                  // });

                  webSocket.publish("adminOrderUpdates", resultObj.ops[0], { qos: 2 }, function (mqttErr, mqttRes) { });

                  sendNotification(orderObj);
                  sendNotificationManager(managerObj, request.payload.status, request.payload.orderId, orderObj);

                  orders.remove({ orderId: request.payload.orderId }, "orderAccepted", function (err, removeObj) {
                    cb(null, "done");
                  });
                });
              } else {
                orders.insert(orderObj, "unassignOrders", (err, resultObj) => {
                  finalData = resultObj.ops[0];
                  if (finalData.bookingType != 2) {
                    order.setExPresence(
                      {
                        time: 1,
                        key: "storeAcceptExpire_" + request.payload.orderId + ""
                      },
                      (err, data) => { }
                    );
                  }
                  // webSocket.publish('orderUpdates', resultObj.ops[0], { qos: 2 }, function (mqttErr, mqttRes) {
                  // });

                  webSocket.publish("adminOrderUpdates", resultObj.ops[0], { qos: 2 }, function (mqttErr, mqttRes) { });
                  sendNotification(orderObj);
                  sendNotificationManager(managerObj, request.payload.status, request.payload.orderId, orderObj);

                  orders.remove({ orderId: request.payload.orderId }, "orderAccepted", function (err, removeObj) {
                    cb(null, "done");
                  });
                });
              }
            });
            break;

          case 5:
          case 6:
            orders.getOrder(request.payload, "pickupOrders", (err, orderObj) => {
              sendNotification(orderObj);
              sendNotificationManager(managerObj, request.payload.status, request.payload.orderId, orderObj);

              finalData = orderObj;

              // webSocket.publish('orderUpdates', orderObj, { qos: 2 }, function (mqttErr, mqttRes) {
              // });

              webSocket.publish("adminOrderUpdates", orderObj, { qos: 2 }, function (mqttErr, mqttRes) { });
              cb(null, "done");
            });

            break;

          case 7:
            orders.getOrder(request.payload, "pickupOrders", (err, orderObj) => {
              orders.insert(orderObj, "completedOrders", (err, resultObj) => {
                sendNotification(orderObj);

                sendNotificationManager(managerObj, request.payload.status, request.payload.orderId, resultObj.ops[0]);

                //updating order analytics.
                orderAnalytics.orderAnalytic(orderObj);

                finalData = resultObj.ops[0];

                // webSocket.publish('orderUpdates', resultObj.ops[0], { qos: 2 }, function (mqttErr, mqttRes) {
                // });

                webSocket.publish("adminOrderUpdates", resultObj.ops[0], { qos: 2 }, function (mqttErr, mqttRes) { });

                // to calculate accounting prices
                accounting
                  .calculate(request.payload.orderId) // accounting/pickup
                  .then(orderAccount => {
                    if (orderAccount.data) {
                      const rec = {
                        cashCollected: orderAccount.data.paidBy.cash,
                        cardDeduct: orderAccount.data.paidBy.card,
                        WalletTransaction: orderAccount.data.paidBy.wallet,

                        pgComm: orderAccount.data.accouting.pgEarningValue,

                        appEarning: orderAccount.data.accouting.appEarningValue,

                        driverId: orderAccount.data.driverId || "",
                        driverEarning: orderAccount.data.accouting.driverEarningValue,

                        storeId: orderAccount.data.storeId || "",
                        storeEarning: orderAccount.data.accouting.storeCommissionValue,

                        franchiseId: orderAccount.data.franchiseId || "",
                        franchiseEarning: orderAccount.data.accouting.franchiseEarningValue,

                        partnerId: orderAccount.data.partnerId || "",
                        partnerEarning: orderAccount.data.accouting.partnerEarningValue,

                        userId: orderAccount.data.customerDetails.customerId,

                        currency: orderAccount.data.currency,
                        currencySymbol: orderAccount.data.currencySymbol,
                        orderId: orderAccount.data.orderId,
                        serviceType: orderAccount.data.serviceType,
                        serviceTypeText: orderAccount.data.serviceType === 1 ? "delivery" : "pickup",
                        driverType:
                          typeof orderAccount.data.driverDetails != "undefined" &&
                            typeof orderAccount.data.driverDetails.driverType != "undefined"
                            ? orderAccount.data.driverDetails.driverType
                            : 1,
                        paymentTypeText: orderAccount.data.paymentTypeMsg,
                        cityName: orderAccount.data.city,
                        cityId: orderAccount.data.cityId
                      };

                      wallet.walletEntryForOrdering(rec, (error, result) => {
                        if (error) {
                          logger.error(error);
                          logger.error("error");
                        }
                      });
                      orders.remove({ orderId: request.payload.orderId }, "pickupOrders", function (err, removeObj) {
                        cb(null, "done");
                      });
                    }
                  })
                  .catch(err => {
                    logger.error("err while accounting", err);
                  });
              });
            });
            break;

          case 25:
            orders.getOrder(request.payload, "unassignOrders", (err, orderObj) => {
              managerTopics.sendToWebsocket(orderObj, 0, (err, res) => { });
              webSocket.publish("adminOrderUpdates", orderObj, { qos: 2 }, function (mqttErr, mqttRes) { });
              finalData = orderObj;


              sendNotification(orderObj);
              sendNotificationManager(managerObj, request.payload.status, request.payload.orderId, orderObj);
              cb(null, "done");
            });
            break;
        }
      }
    ],
    (err, result) => {
      if (err) return reply({ message: request.i18n.__("genericErrMsg")["500"] }).code(500);

      // if (request.payload.status == 4 && finalData.autoDispatch == 1) {

      //   superagent
      //     .post(config.autodispatchUrl)
      //     .send({ orderId: request.payload.orderId, timestamp: moment().unix() })
      //     .end(function (err, res) { });
      // }
      logger.info("sending response"+ JSON.stringify(finalData));
      return reply({ message: request.i18n.__("ordersList")["200"], data: finalData }).code(200);
    }
  );
  function sendNotification(data) {
    //send mqtt notification to customer
    let customerData = {
      status: parseInt(data.status),
      statusMessage: data.statusMsg ? data.statusMsg : "",
      statusMsg: data.statusMsg ? data.statusMsg : "",
      bid: data.orderId
    };

    //send fcm topic push to customer
    // 2 - managerCancel, 3 - managerReject, 4 - managerAccept, 5 - orderReady, 6 - orderPicked, 7 - orderCompleted

    let msg = request.i18n.__(request.i18n.__('bookingStatusMsg')[data.status]);
    let title = request.i18n.__(request.i18n.__('bookingStatusTitle')[data.status]);
    if (parseInt(data.status) == 7) {
      customerData.driverName = data.driverDetails ? data.driverDetails.fName : "";
      customerData.driverLName = data.driverDetails ? data.driverDetails.lName : "";
      customerData.driverImage = data.driverDetails ? data.driverDetails.image : "";
      (customerData.totalAmount = data ? data.totalAmount : ""),
        (customerData.bookingDate = data ? data.bookingDate : ""),
        (customerData.storeName = data ? data.storeName : ""),
        (customerData.serviceType = data ? data.serviceType : ""),
        (customerData.pickupAddress = data.pickup ? data.pickup.addressLine1 : ""),
        (customerData.pickAddress = data.pickup ? data.pickup.addressLine1 : ""),
        (customerData.dropAddress = data.drop ? data.drop.addressLine1 : "");
      notifyi.notifyRealTime({ listner: data.customerDetails.mqttTopic, message: customerData });
      notifications.notifyFcmTopic(
        {
          action: 11,
          usertype: 1,
          deviceType: data.customerDetails.deviceType,
          notification: "",
          msg: msg,
          fcmTopic: data.customerDetails.fcmTopic || "",
          title: title, //config.appName,
          data: customerData
        },
        () => { }
      );
    } else {
      notifyi.notifyRealTime({ listner: data.customerDetails.mqttTopic, message: customerData });
      notifications.notifyFcmTopic(
        {
          action: 11,
          usertype: 1,
          deviceType: data.customerDetails.deviceType,
          notification: "",
          msg: msg,
          fcmTopic: data.customerDetails.fcmTopic || "",
          title: title, //config.appName,
          data: customerData
        },
        () => { }
      );
    }
  }

  function sendNotificationManager(data, status, orderid, orderdata) {

    let msg = request.i18n.__(request.i18n.__('bookingStatusMsg')[status]);
    let title = request.i18n.__(request.i18n.__('bookingStatusTitle')[status]);

    let customerData = {
      status: parseInt(status),
      bid: orderid,
      msg: msg,
      statusMsg: title,
      orderId: orderid
    };
    managerTopics.sendToWebsocket(orderdata, 0, (err, res) => { });

  }

};


const responseCode = {}; //swagger response code

module.exports = {
  handler,
  validator,
  responseCode
};
