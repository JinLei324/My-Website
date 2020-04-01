'use strict';

const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const async = require('async');
const ObjectID = require('mongodb').ObjectID;
const webSocket = require('../../../../../library/websocket/websocket');
const providerErrorMsg = require('../../../../../locales');
let bookingsUnassigned = require('../../../../../models/bookingsUnassigned');
let bookingsAssigned = require('../../../../../models/bookingsAssigned');
let customer = require('../../../../../models/customer');
let locationLogs = require('../../../../../models/locationLogs');
let provider = require('../../../../../models/driver');
const redis = require('../../../../../library/redis');
var notifyi = require('../../../../../library/mqttModule/mqtt');
var notifications = require('../../../../../library/fcm');
var config = process.env;
// var liveTrack = require('../../../../../models/liveTracking');
let serverDispatcher = require('../../../../../worker/handlers/serverDispatcher/serverDispatcher');
let client = redis.client;
var dispatchLogs = require('../../../../../models/dispatchLogs');
var managerTopics = require('../../../../commonModels/managerTopics');
/** salesforce
* @library 
* @author Umesh Beti
*/
const superagent = require('superagent');
const salesforce = require('../../../../../library/salesforce');

/*salesforce*/
const payload = Joi.object({
    orderId: Joi.number().integer().required().description('booking id'),
    status: Joi.number().integer().allow([8, 9]).required().description('8 - Accept, 9 - Reject'),
    lat: Joi.number().description('latitude'),
    long: Joi.number().description('longitude')
}).required();

const APIHandler = (req, reply) => {
    const dbErrResponse = { message: req.i18n.__('genericErrMsg')['500'], code: 500 };
    let condition = {
        'orderId': req.payload.orderId,
        'dispatched.driverId': new ObjectID(req.auth.credentials._id.toString()),
        // 'status': 1
    };

    let bookingData = {};
    let customerData = {};
    let masterData = {};
    let vehicleData = {};
    let timeStamp = moment().unix();
    let iso = new Date();
    //let timeStamp = new Date()
    let statusMsg = "";
    let checkBooking = () => {
        return new Promise((resolve, reject) => {
            bookingsUnassigned.SelectOne(condition, function (err, bookingDataDB) {
                if (err) {
                    reject(dbErrResponse);
                } else if (bookingDataDB) {
                    bookingData = bookingDataDB;
                    resolve(true);
                } else {
                    reject({ message: req.i18n.__('postRespondTo')['404'], code: 404 });
                }
            });
        });
    };
    let getCustomerData = () => {
        return new Promise((resolve, reject) => {
            customer.getOne({ _id: bookingData.customerDetails ? new ObjectID(bookingData.customerDetails.customerId) : "" }, function (err, customer) {
                if (err) {
                    reject(dbErrResponse);
                } else if (customer) {
                    customerData = customer;
                    resolve(true);
                } else {
                    logger.error('customer not found ');
                    reject({ message: req.i18n.__('postRespondTo')['404'], code: 404 });
                }
            });
        });
    };
    let getMasterData = () => {
        return new Promise((resolve, reject) => {
            let conditionMaster = { "_id": new ObjectID(req.auth.credentials._id.toString()) };
            provider.SelectOne(conditionMaster, function (err, masterDataDB) {
                if (err) {
                    reject(dbErrResponse);
                } else if (masterDataDB) {
                    masterData = masterDataDB;
                    resolve(true);
                } else {
                    reject({ message: req.i18n.__('postRespondTo')['405'], code: 405 });
                }
            });
        });
    };

    let checkResponse = () => {
        return new Promise((resolve, reject) => {


            switch (parseInt(req.payload.status)) {
                case 9:

                    // calculate acceptance rate for driver
                    provider.FINDONEANDUPDATE({
                        query: { _id: new ObjectID(req.auth.credentials._id) },
                        data: {
                            $inc: {
                                'acceptance.rejectedBookings': 1,
                                'acceptance.ignoredBookings': -1
                            }
                        }
                    }, (err, result) => {
                        if (result.value) {
                            let driverData = result.value;
                            let acceptedBookings = driverData.acceptance && driverData.acceptance.acceptedBookings ? driverData.acceptance.acceptedBookings : 0;
                            let totalBookings = driverData.acceptance && driverData.acceptance.totalBookings ? driverData.acceptance.totalBookings : 0;
                            let acceptanceRate = ((acceptedBookings / totalBookings) * 100);
                            provider.FINDONEANDUPDATE({
                                query: { _id: new ObjectID(req.auth.credentials._id) },
                                data: { $set: { 'acceptance.acceptanceRate': parseFloat(parseFloat(acceptanceRate).toFixed(2)) } }
                            }, (err, result) => {
                            });
                        }
                    });
                    provider.updateWithoutPromise(
                        { _id: new ObjectID(req.auth.credentials._id.toString()) },
                        { isPopupShowing: false }, function (err, booking) { });
                    bookingsUnassigned.Update(condition, {
                        'dispatched.$.rejectedTime': timeStamp, 'dispatched.$.rejectedTimeiso': iso, 'dispatched.$.status': 'Rejected', 'isPopupShowing': false,
                        "inDispatch": false, // yun 44 added
                        // "failedDispatch": true// yun 44 added
                    }, function (err, result1) {
                        if (err) {
                            reject(dbErrResponse);
                        } else {

                            logger.warn('came to rejected');
                            dispatchLogs.update({ "bookingId": bookingData.orderId, "driverId": new ObjectID(req.auth.credentials._id.toString()) }, {
                                $set: {
                                    responseTime: moment().unix(),
                                    responseTimeiso: new Date(),
                                    "status": 9,
                                    "inDispatch": false, // yun 44 added
                                    "statusMsg": "order Rejected",
                                    "statusText": "Order has been rejected by " + masterData.firstName + ' ' + masterData.lastName
                                }
                            }, (err, result) => {

                            });

                            webSocket.publish('dispatchLog', {
                                "bookingId": bookingData.orderId, "driverId": new ObjectID(req.auth.credentials._id.toString()), responseTime: moment().unix(), "status": 9, "inDispatch": false, // yun 44 added
                                "statusMsg": "order Rejected"
                            }, { qos: 2 }, function (mqttErr, mqttRes) {
                            });
                            //----------Sending Notification To Dispatcher-----------//
                            let dispatcherData = {
                                status: 101,
                                bid: req.payload.orderId,
                                name: masterData.firstName + ' ' + masterData.lastName,
                                email: masterData.email,
                                inDispatch: bookingData.inDispatch
                            };
                            notifyi.notifyRealTime({ 'listner': 'bookingChn', message: dispatcherData });
                            serverDispatcher.bookingAction(req.payload.orderId, req.auth.credentials._id, 1, function (err, bookingdata) {
                                if (err) {
                                    reject(dbErrResponse);
                                } else {
                                    return reply({ message: req.i18n.__('postRespondTo')['200'], code: 200 });
                                }
                            });
                        }
                    });
                    break;
                case 8:
                    provider.FINDONEANDUPDATE({
                        query: { _id: new ObjectID(req.auth.credentials._id) },
                        data: {
                            $inc: {
                                'acceptance.acceptedBookings': 1,
                                'acceptance.ignoredBookings': -1
                            }
                        }
                    }, (err, result) => {
                        if (result.value) {
                            let driverData = result.value;
                            let acceptedBookings = driverData.acceptance && driverData.acceptance.acceptedBookings ? driverData.acceptance.acceptedBookings + 1 : 1;
                            let totalBookings = driverData.acceptance && driverData.acceptance.totalBookings ? driverData.acceptance.totalBookings : 0;
                            let acceptanceRate = ((acceptedBookings / totalBookings) * 100);
                            provider.FINDONEANDUPDATE({
                                query: { _id: new ObjectID(req.auth.credentials._id) },
                                data: { $set: { 'acceptance.acceptanceRate': parseFloat(parseFloat(acceptanceRate).toFixed(2)) } }
                            }, (err, result) => {
                            });
                        }
                    });
                    logger.warn('came to accpeted');
                    dispatchLogs.update({ "bookingId": bookingData.orderId, "driverId": new ObjectID(req.auth.credentials._id.toString()) }, {
                        $set: {
                            responseTime: moment().unix(),
                            responseTimeiso: new Date(),
                            "status": 8,
                            "inDispatch": false, // yun 44 added
                            "statusMsg": "Accepted",
                            "statusText": "Order has been assined to " + masterData.firstName + ' ' + masterData.lastName
                        }
                    }, (err, result) => {
                        /* Salesfor @umesh Beti */
                        var authData = salesforce.get();
                        var DataToSalesforce = {
                            "orderId": bookingData.orderId,
                            "orderStatus": "Accepted"
                        }
                        if (authData) {
                            superagent
                                .patch(authData.instanceUrl + '/services/apexrest/delivx/order')
                                .send(DataToSalesforce) // sends a JSON post body
                                .set('Accept', 'application/json')
                                .set('Authorization', 'Bearer ' + authData.accessToken)
                                .end((err, res) => {
                                    if (err) {

                                    } else {
                                        logger.info('Send To Salesforce Success');
                                    }
                                });
                        }
                        /* Salesfor @umesh Beti */


                    });


                    webSocket.publish('dispatchLog', {
                        "bookingId": bookingData.orderId, "driverId": new ObjectID(req.auth.credentials._id.toString()), responseTime: moment().unix(), "status": 8, "statusMsg": "Accepted", "statusText": "Order has been assined to " + masterData.firstName + ' ' + masterData.lastName,
                        "inDispatch": false, // yun 44 added

                    }, { qos: 2 }, function (mqttErr, mqttRes) {
                    });

                    serverDispatcher.bookingAction(req.payload.orderId, req.auth.credentials._id, 2, function (err, bookingdata) {
                        if (err) {
                            reject(dbErrResponse);
                        } else {

                            resolve(true);
                        }
                    });
                    break;
                default:
                    reject({ message: req.i18n.__('postRespondTo')['406'], code: 406 });
            }
        });
    };

    let updateBookingData = () => {
        return new Promise((resolve, reject) => {
            if (bookingData.storeType == 5 && bookingData.isCominigFromStore == false) {
                statusMsg = "Not Picked";
            } else if (bookingData.storeType == 5 && bookingData.isCominigFromStore == true) {
                statusMsg = "Picked";
            } else {
                statusMsg = req.i18n.__(req.i18n.__('bookingStatusTitle')['8']);
            }
            let updateData = {
                $set: {
                    'status': parseInt(req.payload.status),
                    'driverId': new ObjectID(req.auth.credentials._id),
                    "statusMsg": statusMsg,
                    "statusText": statusMsg,//"Order has been assined to " + masterData.firstName + ' ' + masterData.lastName,
                    'dispatched.$.status': 'Accepted',
                    // 'receivers.0.DriverAcceptedTime': timeStamp,
                    // 'receivers.0.status': parseInt(req.payload.status),
                    // 'receivers.0.status': parseInt(req.payload.status),
                    // 'vehicleData': vehicleData,
                    // 'vehicleType':vehicleType,
                    'isPopupShowing': false,
                    'inDispatch': false,
                    "visiableInAccept": true,
                    'driverDetails': {
                        'driverId': new ObjectID(masterData._id.toString()),
                        'mobile': masterData.mobile || '',
                        'driverType': masterData.driverType,//1 - freelancer, 3 - store driver
                        'countryCode': masterData.countryCode || '',
                        'fName': masterData.firstName,
                        'chn': masterData.publishChn || '',
                        'lName': masterData.lastName || '',
                        'image': masterData.profilePic || '',
                        'email': masterData.email || '',
                        "mqttTopic": masterData.listner || '', // channel of MQTT
                        "fcmTopic": masterData.pushToken || '', //push topic from FCM
                        'LastTs': masterData.lastTs || '',
                        'app_version': masterData.appVersion || '',
                        'battery_Per': masterData.batteryPer || '',
                        'location_check': masterData.locationCheck || '',
                        'Device_type_': masterData.mobileDevices.deviceType || '',
                        'location_Heading': masterData.locationHeading || '',
                        'driversLatLongs': masterData.location.latitude + ',' + masterData.location.longitude,
                        'operatorId': masterData.companyId || ''
                    },
                    'masterPushTopic': masterData.pushToken || '',
                    'timeStamp.accepted': {                //timeStamp
                        statusUpdatedBy: "driver",//dispatcher / driver / customer
                        userId: new ObjectID(masterData._id.toString()),
                        timeStamp: timeStamp,
                        isoDate: iso,
                        location: {
                            longitude: masterData.location.longitude,
                            latitude: masterData.location.latitude
                        },
                        message: "Accepted",
                        ip: "0.0.0.0"
                    }
                }
                ,
                $push: {
                    activityLogs: {                //timeStamp
                        // accepted: {
                        state: 'accepted',
                        statusUpdatedBy: "driver",//dispatcher / driver / customer
                        userId: new ObjectID(masterData._id.toString()),
                        timeStamp: timeStamp,
                        isoDate: iso,
                        location: {
                            longitude: masterData.location.longitude,
                            latitude: masterData.location.latitude
                        },
                        message: "Accepted",
                        ip: "0.0.0.0"
                        // }
                    }
                }
            }


            bookingsUnassigned.UpdatePushData(condition, updateData, function (err, result1) {
                if (err) {
                    reject(dbErrResponse);
                } else {
                    bookingData = result1.value;
                    //----------Sending Notification To Dispatcher-----------//

                    let dispatcherData = {
                        status: 8,
                        bid: req.payload.orderId,
                        // _id:bookingData._id
                        // name: masterData.firstName + ' ' + masterData.lastName,
                        // email: masterData.email,
                        // inDispatch: bookingData.inDispatch
                    };

                    //   notifyi.notifyRealTime({ 'orderUpdates':  bookingData.customerDetails.mqttTopic, message: dispatcherData1 });

                    //------sending notificaton to customer----------
                    let dispatcherData1 = {
                        status: 8,
                        statusMessage: req.i18n.__(req.i18n.__('bookingStatusTitle')['8']),
                        statusMsg: req.i18n.__(req.i18n.__('bookingStatusTitle')['8']),
                        // statusMsg: req.i18n.__(req.i18n.__('bookingStatusMsg')['8'], masterData.firstName, masterData.countryCode, masterData.mobile, config.appName),
                        bid: req.payload.orderId,
                    };
                    dispatcherData1.driverId = bookingData.driverDetails ? bookingData.driverDetails.driverId : "";
                    dispatcherData1.driverName = bookingData.driverDetails ? bookingData.driverDetails.fName : "";
                    dispatcherData1.driverLName = bookingData.driverDetails ? bookingData.driverDetails.lName : "";
                    dispatcherData1.driverImage = bookingData.driverDetails ? bookingData.driverDetails.image : "";
                    dispatcherData1.totalAmount = bookingData ? bookingData.totalAmount : "";
                    dispatcherData1.bookingDate = bookingData ? bookingData.bookingDate : "";
                    dispatcherData1.storeName = bookingData ? bookingData.storeName : "";
                    dispatcherData1.serviceType = bookingData ? bookingData.serviceType : "";
                    dispatcherData1.pickupAddress = bookingData.pickup ? bookingData.pickup.addressLine1 : "";
                    dispatcherData1.dropAddress = bookingData.drop ? bookingData.drop.addressLine1 : "";
                    if (customerData.mqttTopic) {
                        notifyi.notifyRealTime({ 'listner': customerData.mqttTopic, message: dispatcherData1 });
                    }
                    if (customerData.fcmTopic) {
                        notifications.notifyFcmTopic({
                            action: 11,
                            usertype: 1,
                            deviceType: customerData.mobileDevices ? customerData.mobileDevices.deviceType : 1,
                            notification: "",
                            // msg: 'Driver assigned',
                            msg: req.i18n.__(req.i18n.__('bookingStatusMsg')['8'], masterData.firstName, masterData.countryCode, masterData.mobile, config.appName),
                            fcmTopic: customerData.fcmTopic || '',
                            title: 'Booking accepted by driver.',
                            title: req.i18n.__(req.i18n.__('bookingStatusTitle')['8']),
                            data: dispatcherData1
                        }, () => {

                        });
                    }



                    notifyi.notifyRealTime({ 'listner': 'bookingChn', message: dispatcherData });

                    resolve(true);
                }
            });
        });
    };

    let updateLogs = () => {
        return new Promise((resolve, reject) => {
            let currentBookings = masterData.currentBookings || [];
            currentBookings.push({ bid: bookingData.orderId });//push the current booking

            //log the booking activity
            LogBookingActivity(
                currentBookings,
                {
                    bid: bookingData.orderId,
                    status: 8,
                    msg: 'Booking accepted by driver.',
                    time: timeStamp,
                    isoDate: iso,
                    lat: req.payload.lat || '',
                    long: req.payload.long || ''
                }, () => {
                });

            //if Ride Booking then make  driver as Busy
            var busyInRide = 0;
            if (bookingData.serviceType == 2 && bookingData.appt_type == 1)
                busyInRide = 1;

            //set onJob flag & currentBookings
            provider.FINDONEANDUPDATE({
                query: { _id: new ObjectID(masterData._id.toString()) },
                data: {
                    $inc: { currentBookingsCount: 1 },
                    $set: { onJob: true, busyInRide: busyInRide, apptStatus: 8 },
                    $push: { currentBookings: { bid: bookingData.orderId, time: timeStamp, isoDate: iso } }
                }
            }, () => {
            });
            resolve(true);
        });
    };

    let shiftBookingData = () => {
        return new Promise((resolve, reject) => {
            let conditionData = {
                'orderId': req.payload.orderId
            };
            bookingsUnassigned.SelectOne(conditionData, function (err, bookingDataFull) {
                if (err) {
                    reject(dbErrResponse);
                } else if (bookingDataFull) {

                    //    //---------- send notification to dispatcher -------------//
                    // webSocket.publish('orderUpdates', bookingDataFull, { qos: 2 }, function (mqttErr, mqttRes) {
                    // });

                    let dispatcherDataone = {
                        statusMsg: "Booking accepted by driver.",
                        status: parseInt(bookingDataFull.status),
                        bid: bookingDataFull.orderId,
                        _id: bookingDataFull._id,
                        orderId: bookingDataFull.orderId
                    };
                    // webSocket.publish('stafforderUpdates', dispatcherDataone, { qos: 2 }, function (mqttErr, mqttRes) {
                    // });

                    // webSocket.publish('adminOrderUpdates', bookingDataFull, { qos: 2 }, function (mqttErr, mqttRes) { // yunus
                    // });
                    // webSocket.publish('stafforderUpdate/' + bookingDataFull.storeId + '', bookingDataFull, { qos: 2 }, function (mqttErr, mqttRes) {
                    // });
                    if (parseInt(req.payload.status) == 9) { // yun 3g3 added
                        bookingDataFull.failedDispatch = true
                        bookingDataFull.inDispatch = false
                    } else {
                        bookingDataFull.inDispatch = false
                        delete bookingDataFull.failedDispatch;
                        managerTopics.sendToWebsocket(bookingDataFull, 0, (err, res) => {
                        });
                    }

                    bookingsAssigned.createNewBooking(bookingDataFull)
                        .then((result) => {
                            bookingsUnassigned.Remove(conditionData, function (err, res) {
                                if (err) {
                                    reject(dbErrResponse);
                                } else {
                                    resolve({ message: req.i18n.__('postRespondTo')['200'], code: 200 });
                                }
                            });
                        })
                        .catch((err) => {
                            reject(dbErrResponse);
                        });
                } else {
                    reject({ message: req.i18n.__('postRespondTo')['404'], code: 404 });
                }
            });
        });
    };

    checkBooking()
        .then(getCustomerData)
        .then(getMasterData)
        .then(checkResponse)
        // .then(getVehicleData)
        .then(updateBookingData)
        .then(updateLogs)
        .then(shiftBookingData)
        .then((data) => {
            return reply({ message: req.i18n.__('postRespondTo')['200'] }).code(200);
        }).catch((e) => {
            return reply({ message: e.message }).code(e.code);
        });
};

let lang = providerErrorMsg['langaugeId'];

const responseCode = {
    status: {
        500: { message: providerErrorMsg['genericErrMsg']['500'] },
        200: { message: providerErrorMsg['postRespondTo']['200'] },
        400: { message: providerErrorMsg['postRespondTo']['400'] },
        404: { message: providerErrorMsg['postRespondTo']['404'] },
        405: { message: providerErrorMsg['postRespondTo']['405'] },
        406: { message: providerErrorMsg['postRespondTo']['405'] },
        407: { message: providerErrorMsg['postRespondTo']['405'] }
    }
}//swagger response code

module.exports = { payload, APIHandler, responseCode };

/**
 * Method to log the booking activity along with time stamps
 * @param {*} params - bid, status, msg, time
 * @param {*} callback - async method
 */
function LogBookingActivity(currentBookings, params, callback) {

    async.forEach(currentBookings, (item, cb) => {
        let data = {
            $set: {
                lt: params.lat,
                lg: params.long
            },
            $push: {
                activities:
                {
                    bid: params.bid,
                    status: parseInt(params.status),
                    msg: params.msg,
                    time: params.time,
                    lat: params.lat,
                    long: params.long
                }
            }
        };

        let options = {};// upsert: true };

        let locationLogsData = {
            $push: {
                activities:
                {
                    bid: params.bid,
                    status: parseInt(params.status),
                    msg: params.msg,
                    time: params.time,
                    lat: params.lat,
                    long: params.long
                }
            }
        };

        if (item.bid == params.bid)
            locationLogsData['$push'][params.status] = params.lat + ',' + params.long;

        locationLogs.FINDONEANDUPDATE(
            { query: { bid: item.bid }, data: locationLogsData, options: options },
            // () => { return callback(null, 'done') });
            () => {
                return;
            });

        bookingsAssigned.FINDONEANDUPDATE(
            { query: { orderId: item.bid }, data: data, options: options },
            // () => { return callback(null, 'done') });
            () => {
                return;
            });

        return cb(null, 'done');

    }, (err, result) => {
        return callback(null, 'done')
    });
}