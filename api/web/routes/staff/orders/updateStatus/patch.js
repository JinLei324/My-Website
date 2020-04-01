'use strict'
const orders = require('../../../../../models/orders');
const orderAnalytics = require('../../../../commonModels/orderAnalytics');
var notifications = require('../../../../../library/fcm');
var notifyi = require('../../../../../library/mqttModule/mqtt');
const webSocket = require('../../../../../library/websocket/websocket');
const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language 
const manager = require('../../../../../models/storeManagers');
const common = require('../../../../commonModels/orderAnalytics');
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const Async = require('async');
const redis = require('../../../../../library/redis');
var managerTopics = require('../../../../commonModels/managerTopics');
let client = redis.client;
const accounting = require('../../../../commonModels/accounting/accounting');
const superagent = require('superagent');
const wallet = require('../../../../commonModels/wallet/wallet');
const stripeTransaction = require('../../../../commonModels/stripe/stripeTransaction');
/** 
* @function
* @name handler 
* @return {object} Reply to the user.
* @name status (1-new, 2 - managerCancel, 3 - managerReject, 4 - managerAccept, 5 - orderReady, 6 - orderPicked, 7 - orderCompleted )  
*/
const handler = (request, reply) => {


    manager.get({ id: request.payload.managerId }, (err, managerObj) => {
        if (err) return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);

        if (managerObj)
            request.payload.managerName = managerObj.name;

        Async.series([

            function (cb) {

                switch (request.payload.status) {

                    case 2:
                        request.payload.statusMsg = request.i18n.__(request.i18n.__('bookingStatusMsg')[request.payload.status]);
                        request.payload.statusText = request.i18n.__(request.i18n.__('bookingStatusMsg')[request.payload.status]);
                        if (request.payload.serviceType == 1) {  // delivery 
                            orders.orderCancel(request.payload, 'unassignOrders', (err, unassignOrdersObj) => {
                                cb(null, 'done');
                            });
                        } else {  //pickup
                            orders.orderCancel(request.payload, 'pickupOrders', (err, pickupObj) => {
                                cb(null, 'done');
                            });
                        }

                        client.get("nowBooking_" + request.payload.orderId, function (err, object) {
                            if (object == null) {
                            } else {
                                client.del("nowBooking_" + request.payload.orderId, function (err, reply) {
                                })
                            }
                        })

                        break;

                    case 3:
                        request.payload.statusMsg = request.i18n.__(request.i18n.__('bookingStatusMsg')[request.payload.status]);
                        request.payload.statusText = request.i18n.__(request.i18n.__('bookingStatusMsg')[request.payload.status]);
                        orders.orderCancel(request.payload, 'newOrder', (err, newOrdersObj) => {
                            cb(null, 'done');
                        });
                        client.get("nowBooking_" + request.payload.orderId, function (err, object) {
                            if (object == null) {
                            } else {
                                client.del("nowBooking_" + request.payload.orderId, function (err, reply) {
                                })
                            }
                        })
                        break;

                    case 4:
                        request.payload.statusMsg = request.i18n.__(request.i18n.__('bookingStatusMsg')[request.payload.status]);
                        request.payload.statusText = request.i18n.__(request.i18n.__('bookingStatusMsg')[request.payload.status]);
                        orders.orderStatus(request.payload, 'newOrder', (err, newOrdersObj) => {
                            cb(null, 'done');
                        });

                        client.get("nowBooking_" + request.payload.orderId, function (err, object) {

                            if (object == null) {
                            } else {
                                client.del("nowBooking_" + request.payload.orderId, function (err, reply) {
                                })
                            }
                        })
                        break;

                    case 5: case 6: case 7:

                        if (request.payload.status == 5)
                            request.payload.statusMsg = request.i18n.__(request.i18n.__('bookingStatusMsg')[request.payload.status]);

                        if (request.payload.status == 6)
                            request.payload.statusMsg = request.i18n.__(request.i18n.__('bookingStatusMsg')[request.payload.status]);

                        if (request.payload.status == 7)
                            request.payload.statusMsg = request.i18n.__(request.i18n.__('bookingStatusMsg')[request.payload.status]);

                        orders.orderStatus(request.payload, 'pickupOrders', (err, newOrdersObj) => {
                            cb(null, 'done');
                        });
                        break;

                    case 18:
                        request.payload.statusMsg = request.i18n.__(request.i18n.__('bookingStatusMsg')[request.payload.status]);
                        request.payload.statusText = request.i18n.__(request.i18n.__('bookingStatusMsg')[request.payload.status]);

                        if (request.payload.serviceType == 1) {
                            orders.orderDueTime(request.payload, 'unassignOrders', (err, unassignOrdersObj) => {
                                cb(null, 'done');
                            });
                        } else {
                            orders.orderDueTime(request.payload, 'pickupOrders', (err, pickupOrdersObj) => {
                                cb(null, 'done');
                            });
                        }
                        break;

                    default: cb(null, 'done');
                        break;


                }

            },
            function (cb) {

                switch (request.payload.status) {

                    case 2:

                        if (request.payload.serviceType == 1) {
                            orders.getOrder(request.payload, 'unassignOrders', (err, orderObj) => {
                                if (orderObj) {
                                    common.unlockPromoCode(orderObj);

                                    orders.insert(orderObj, 'completedOrders', (err, resultObj) => {

                                        //send message to dispatcher
                                        // webSocket.publish('stafforderUpdates', resultObj.ops[0], { qos: 2 }, function (mqttErr, mqttRes) {
                                        // });

                                        webSocket.publish('adminOrderUpdates', resultObj.ops[0], { qos: 2 }, function (mqttErr, mqttRes) {
                                        });

                                        sendNotification(orderObj);

                                        sendNotificationManager(managerObj, request.payload.status, request.payload.orderId, orderObj);

                                        orders.remove({ orderId: request.payload.orderId }, 'unassignOrders', function (err, removeObj) {
                                            cb(null, 'done');
                                        });
                                    });
                                } else { // yunus added
                                    orders.getOrder(request.payload, 'assignOrders', (err, orderObj) => {
                                        common.unlockPromoCode(orderObj);

                                        orders.insert(orderObj, 'completedOrders', (err, resultObj) => {

                                            //send message to dispatcher
                                            // webSocket.publish('stafforderUpdates', resultObj.ops[0], { qos: 2 }, function (mqttErr, mqttRes) {
                                            // });
                                            // webSocket.publish('adminOrderUpdates', resultObj.ops[0], { qos: 2 }, function (mqttErr, mqttRes) {
                                            // });

                                            sendNotification(orderObj);

                                            sendNotificationManager(managerObj, request.payload.status, request.payload.orderId, orderObj);

                                            orders.remove({ orderId: request.payload.orderId }, 'unassignOrders', function (err, removeObj) {
                                                cb(null, 'done');
                                            });
                                        });
                                    });
                                }


                            });
                        } else {
                            orders.getOrder(request.payload, 'pickupOrders', (err, orderObj) => {

                                common.unlockPromoCode(orderObj);

                                orders.insert(orderObj, 'completedOrders', (err, resultObj) => {

                                    //send message to dispatcher
                                    // webSocket.publish('stafforderUpdates', resultObj.ops[0], { qos: 2 }, function (mqttErr, mqttRes) {
                                    // });

                                    webSocket.publish('adminOrderUpdates', resultObj.ops[0], { qos: 2 }, function (mqttErr, mqttRes) {
                                    });

                                    sendNotification(orderObj);

                                    sendNotificationManager(managerObj, request.payload.status, request.payload.orderId, orderObj);

                                    orders.remove({ orderId: request.payload.orderId }, 'pickupOrders', function (err, removeObj) {
                                        cb(null, 'done');
                                    });
                                });

                            });

                        }


                        break;

                    case 3:
                        orders.getOrder(request.payload, 'newOrder', (err, orderObj) => {

                            common.unlockPromoCode(orderObj);

                            orders.insert(orderObj, 'completedOrders', (err, resultObj) => {

                                //send message to dispatcher
                                // webSocket.publish('stafforderUpdates', resultObj.ops[0], { qos: 2 }, function (mqttErr, mqttRes) {
                                // });

                                webSocket.publish('adminOrderUpdates', resultObj.ops[0], { qos: 2 }, function (mqttErr, mqttRes) {
                                });

                                sendNotification(resultObj.ops[0]);

                                sendNotificationManager(managerObj, request.payload.status, request.payload.orderId, resultObj.ops[0]);

                                orders.remove({ orderId: request.payload.orderId }, 'newOrder', function (err, removeObj) {
                                    cb(null, 'done');
                                });
                            });

                        });
                        break;

                    case 4:
                        orders.getOrder(request.payload, 'newOrder', (err, orderObj) => {

                            if (orderObj.serviceType == 2) {

                                orders.insert(orderObj, 'pickupOrders', (err, resultObj) => {

                                    // webSocket.publish('stafforderUpdates', resultObj.ops[0], { qos: 2 }, function (mqttErr, mqttRes) {
                                    // });

                                    webSocket.publish('adminOrderUpdates', resultObj.ops[0], { qos: 2 }, function (mqttErr, mqttRes) {
                                    });

                                    sendNotification(resultObj.ops[0]);

                                    sendNotificationManager(managerObj, request.payload.status, request.payload.orderId, resultObj.ops[0]);

                                    orders.remove({ orderId: request.payload.orderId }, 'newOrder', function (err, removeObj) {
                                        cb(null, 'done');
                                    });
                                });

                            } else {

                                orders.insert(orderObj, 'unassignOrders', (err, resultObj) => {

                                    // webSocket.publish('stafforderUpdates', resultObj.ops[0], { qos: 2 }, function (mqttErr, mqttRes) {
                                    // });



                                    webSocket.publish('adminOrderUpdates', resultObj.ops[0], { qos: 2 }, function (mqttErr, mqttRes) {
                                    });

                                    sendNotification(resultObj.ops[0]);

                                    sendNotificationManager(managerObj, request.payload.status, request.payload.orderId, resultObj.ops[0]);

                                    orders.remove({ orderId: request.payload.orderId }, 'newOrder', function (err, removeObj) {
                                        cb(null, 'done');
                                    });


                                });

                            }
                        })
                        break;
                    case 5: case 6:

                        orders.getOrder(request.payload, 'pickupOrders', (err, orderObj) => {

                            sendNotification(orderObj);

                            sendNotificationManager(managerObj, request.payload.status, request.payload.orderId, orderObj);

                            // webSocket.publish('stafforderUpdates', orderObj, { qos: 2 }, function (mqttErr, mqttRes) {
                            // });

                            webSocket.publish('adminOrderUpdates', orderObj, { qos: 2 }, function (mqttErr, mqttRes) {
                            });

                        });

                        cb(null, 'done');

                        break;

                    case 7:
                        orders.getOrder(request.payload, 'pickupOrders', (err, orderObj) => {
                            let payments = () => {
                                return new Promise((resolve, reject) => {
                                    if (orderObj.paymentType == 1 && orderObj.stripeCharge) {// capture charge
                                        stripeTransaction.captureCharge(request, orderObj.stripeCharge.id, orderObj.paidBy.card)
                                            .then((data) => {
                                                orderObj['stripeCapture'] = data;
                                                resolve(true);
                                            }).catch(e => {
                                                return reply({ message: e.message }).code(400);//stripe error logs
                                            });
                                    } else {
                                        resolve(true);
                                    }
                                });
                            }
                            payments().then(data => {
                                orders.insert(orderObj, 'completedOrders', (err, resultObj) => {

                                    sendNotification(orderObj);

                                    //updating order analytics.
                                    orderAnalytics.orderAnalytic(orderObj);

                                    sendNotificationManager(managerObj, request.payload.status, request.payload.orderId, orderObj);

                                    // webSocket.publish('stafforderUpdates', resultObj.ops[0], { qos: 2 }, function (mqttErr, mqttRes) {
                                    // });

                                    webSocket.publish('adminOrderUpdates', resultObj.ops[0], { qos: 2 }, function (mqttErr, mqttRes) {
                                    });
                                    accounting.calculate(request.payload.orderId) // accounting/pickup
                                        .then((orderAccount) => {

                                            if (orderAccount.data) {
                                                const rec = {
                                                    cashCollected: orderAccount.data.paidBy.cash,
                                                    cardDeduct: orderAccount.data.paidBy.card,
                                                    WalletTransaction: orderAccount.data.paidBy.wallet,
                                                    pgComm: orderAccount.data.accouting.pgEarningValue,
                                                    driverEarning: orderAccount.data.accouting.driverEarningValue,
                                                    appEarning: orderAccount.data.accouting.appEarningValue,
                                                    storeEarning: orderAccount.data.accouting.storeEarningValue,
                                                    userId: orderAccount.data.customerDetails.customerId,
                                                    driverId: orderAccount.data.driverId,
                                                    storeId: orderAccount.data.storeId,
                                                    currency: orderAccount.data.currency,
                                                    currencySymbol: orderAccount.data.currencySymbol,
                                                    orderId: orderAccount.data.orderId,
                                                    serviceType: orderAccount.data.serviceType,
                                                    serviceTypeText: (orderAccount.data.serviceType === 1) ? "delivery" : "pickup",
                                                    paymentTypeText: orderAccount.data.paymentTypeMsg,
                                                    cityName: orderAccount.data.city,
                                                    cityId: orderAccount.data.cityId
                                                };

                                                wallet.walletEntryForOrdering(rec, (error, result) => {
                                                    if (error) {
                                                        logger.error(error)
                                                        logger.error('error')
                                                    }
                                                    logger.error(result)
                                                    logger.error('result')
                                                })
                                                orders.remove({ orderId: request.payload.orderId }, 'pickupOrders', function (err, removeObj) {
                                                    cb(null, 'done');
                                                });
                                            }

                                        });

                                    // to calculate accounting prices
                                    // accounting.calculate(request.payload.orderId)
                                    // .then((data) => {
                                    //     superagent.post(config.API_URL + '/accounting/wallet')
                                    //     .send({ orderId: request.payload.orderId })
                                    //     .end(function (err, res) {
                                    //     });  
                                    // })
                                    // to calculate accounting prices

                                });
                            });
                        });
                        break;

                    case 18:
                        if (request.payload.serviceType == 1) {
                            orders.getOrder(request.payload, 'unassignOrders', (err, orderObj) => {


                                //send message to dispatcher
                                // webSocket.publish('stafforderUpdates', orderObj, { qos: 2 }, function (mqttErr, mqttRes) {
                                // });

                                webSocket.publish('adminOrderUpdates', orderObj, { qos: 2 }, function (mqttErr, mqttRes) {
                                });

                                sendNotification(orderObj);

                                sendNotificationManager(managerObj, request.payload.status, request.payload.orderId, orderObj);



                            });
                        } else {
                            orders.getOrder(request.payload, 'pickupOrders', (err, orderObj) => {

                                //send message to dispatcher
                                // webSocket.publish('stafforderUpdates', orderObj, { qos: 2 }, function (mqttErr, mqttRes) {
                                // });

                                webSocket.publish('adminOrderUpdates', orderObj, { qos: 2 }, function (mqttErr, mqttRes) {
                                });

                                sendNotification(orderObj);
                                sendNotificationManager(managerObj, request.payload.status, request.payload.orderId, orderObj);
                            });

                        }

                        break;

                }

            }
        ], (err, result) => {
            if (err) return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);

            return reply({ message: request.i18n.__('ordersList')['200'], data: result }).code(200);

        });

    });

};


/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {

    storeId: Joi.string().required().description('storeId'),
    managerId: Joi.string().required().description('managerId'),
    status: Joi.number().integer().required().description('status  2 - managerCancel, 3 - managerReject, 4 - managerAccept, 5 - orderReady, 6 - orderPicked, 7 - orderCompleted , 18 - delayed(updated delivery time) '),
    timestamp: Joi.number().required().description('timestamp'),
    orderId: Joi.number().integer().required().description('orderId'),
    reason: Joi.string().description('if cancel order/update due time need to give reason'),
    serviceType: Joi.number().required().description('serviceType 2-pickup order , 1- delivery order'),
    dueDatetime: Joi.string().allow('').description('due date time')
}

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
    let msg = "";
    // switch (data.status) {

    //     case 2: msg = request.i18n.__(request.i18n.__('bookingStatusMsg')[data.status]); break;
    //     case 3: msg = "Reject Order"; break;
    //     case 4: msg = "Your order has been accepted by the store and shall be ready soon."; break;// as shiv said
    //     // case 4: msg = "Your order has been accepted by the store. A delivery executive shall be assigned to your order soon."; break;
    //     // case 4: msg = "Order Accept"; break;
    //     case 5: msg = "Order Ready"; break;
    //     case 6: msg = "Order Picked"; break;
    //     case 7: msg = "Completed (Pickup)."; break;
    //     case 18: msg = "The store is running late on its previous orders and your order will now be delivered at " + data.dueDatetime + "."; break;
    //     // case 18: msg = "Order duetime updated"; break;

    // }
    msg = request.i18n.__(request.i18n.__('bookingStatusMsg')[data.status]);
    if (parseInt(data.status) == 7) {
        customerData.driverName = data.driverDetails ? data.driverDetails.fName : ""
        customerData.driverLName = data.driverDetails ? data.driverDetails.lName : ""
        customerData.driverImage = data.driverDetails ? data.driverDetails.image : ""
        customerData.totalAmount = data ? data.totalAmount : "",
            customerData.bookingDate = data ? data.bookingDate : "",
            customerData.storeName = data ? data.storeName : "",
            customerData.serviceType = data ? data.serviceType : "",
            customerData.pickupAddress = data.pickup ? data.pickup.addressLine1 : "",
            customerData.pickAddress = data.pickup ? data.pickup.addressLine1 : "",
            customerData.dropAddress = data.drop ? data.drop.addressLine1 : "";
        notifyi.notifyRealTime({ 'listner': data.customerDetails.mqttTopic, message: customerData });
        notifications.notifyFcmTopic({
            action: 11,
            usertype: 1,
            deviceType: data.customerDetails.deviceType,
            notification: "",
            msg: msg,
            fcmTopic: data.customerDetails.fcmTopic || '',
            title: msg,
            data: customerData
        }, () => {

        });
    } else {
        notifyi.notifyRealTime({ 'listner': data.customerDetails.mqttTopic, message: customerData });
        notifications.notifyFcmTopic({
            action: 11,
            usertype: 1,
            deviceType: data.customerDetails.deviceType,
            notification: "",
            msg: msg,
            fcmTopic: data.customerDetails.fcmTopic || '',
            title: msg,
            data: customerData
        }, () => {

        });
    }


}


function sendNotificationManager(data, status, orderid, orderdata) {
    //send mqtt notification to customer


    let msg = "";
    // switch (status) {

    //     case 2: msg = "Cancel Order"; break;
    //     case 3: msg = "Reject Order"; break;
    //     case 4: msg = "Your order has been accepted by the store and shall be ready soon."; break;// as shiv said
    //     // case 4: msg = "Your order has been accepted by the store. A delivery executive shall be assigned to your order soon."; break;
    //     case 5: msg = "Order Ready"; break;
    //     case 6: msg = "Order Picked"; break;
    //     case 7: msg = "Completed (Pickup)."; break;
    //     case 18: msg = "Order duetime updated"; break;

    // }
    msg = request.i18n.__(request.i18n.__('bookingStatusMsg')[status]);
    let customerData = {
        status: parseInt(status),
        bid: orderid,
        msg: msg,
        statusMsg: msg,
        orderId: orderid
    };
    orderdata.storeId = data.storeId;
    managerTopics.sendToWebsocket(orderdata, 2, (err, res) => {
    });
}

/**
* A module that exports customer get cart handler, get cart validator! 
* @exports handler 
*/
module.exports = { handler, validator }