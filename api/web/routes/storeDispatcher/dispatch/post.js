

'use strict'
const orders = require('../../../../models/orders');
const drivers = require('../../../../models/driver');
const googleApi = require('../../../commonModels/googleApi');
const notifyi = require('../../../../library/mqttModule/mqtt');
const webSocket = require('../../../../library/websocket/websocket');
const error = require('../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;
const Async = require('async');
const bookingsUnassigned = require('../../../../models/bookingsUnassigned');
var dispatchLogs = require('../../../../models/dispatchLogs');
const customer = require('../../../../models/customer');
const notifications = require('../../../../library/fcm');
const redis = require('../../../../library/redis');
let bookingsAssigned = require('../../../../models/bookingsAssigned');
var managerTopics = require('../../../commonModels/managerTopics');
let client = redis.client;

/** 
* @functions
* @name handler 
* @return {object} Reply to the user.
* 
*/
const handler = (request, reply) => {
    let timeStamp = moment().unix();
    let iso = new Date();
    const dbErrResponse = { message: request.i18n.__('genericErrMsg')['500'] };
    if (request.payload.dispatchType == 2) {
        orders.getOrder({ orderId: request.payload.orderId }, 'unassignOrders', (err, orderObj) => {
            if (err) return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);

            drivers.getDriver({ "_id": new ObjectID(request.payload.driverId), status: 3 }, (err, driverObj) => {
                if (err) return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);

                if (!driverObj) {
                    return reply({ message: request.i18n.__('driverList')['200'], data: { errNum: 201, errMSg: "driver not available" } }).code(200);
                } else {

                    if (driverObj.wallet.hardLimitHit == true && orderObj.paymentType == 2) {
                        return reply({ message: request.i18n.__('driverList')['200'], data: { errNum: 202, errMSg: "Driver HardLimit Hit" } }).code(200);
                    } else {
                        let data = {
                            driverLocation: driverObj.location,
                            storeLocation: orderObj.storeCoordinates
                        }
                        distanceMatrix(data, (err, result) => {
                            if (err) return reply({ message: request.i18n.__('driverList')['200'], data: { errNum: 201, errMSg: "not available to dispatch" } }).code(200);
                            // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
                            let deliveryFees = 0;
                            if (orderObj.storeFreeDelivery) {
                                deliveryFees = orderObj.storeDeliveryFee;
                            } else {
                                deliveryFees = orderObj.deliveryCharge;
                            }
                            const pubnubContent = {
                                'action': 29,//for direct assign to send driver
                                'orderDatetime': orderObj.orderDatetime ? orderObj.orderDatetime : "",
                                'orderDateTimeStamp': orderObj.bookingDateTimeStamp ? orderObj.bookingDateTimeStamp : 0,
                                'dueDatetimeTimeStamp': orderObj.dueDatetimeTimeStamp ? orderObj.dueDatetimeTimeStamp : 0,
                                'storeType': orderObj.storeType ? orderObj.storeType : "",
                                'storeTypeMsg': orderObj.storeTypeMsg ? orderObj.storeTypeMsg : "",
                                'amount': orderObj.totalAmount ? orderObj.totalAmount : "",
                                'orderId': orderObj.orderId ? orderObj.orderId : "",
                                'storeName': orderObj.storeName ? orderObj.storeName : "",
                                'pickUpAddress': orderObj.storeAddress ? orderObj.storeAddress : "",
                                'deliveryAddress': (orderObj.drop.flatNumber != "" ? orderObj.drop.flatNumber + "," : "") + (orderObj.drop.landmark != "" ? orderObj.drop.landmark + "," : "") + (orderObj.drop.addressLine1 != "" ? orderObj.drop.addressLine1 + "," : "") + (orderObj.drop.addressLine2 != "" ? orderObj.drop.addressLine2 + "," : "") + (orderObj.drop.city != "" ? orderObj.drop.city + "," : "") + (orderObj.drop.state != "" ? orderObj.drop.state : "") + (orderObj.drop.postalCode != "" ? "-" + orderObj.drop.postalCode : ""),
                                'customerName': orderObj.customerDetails.name,
                                'customerEmail': orderObj.customerDetails.email,
                                'customerMobile': orderObj.customerDetails.mobile,
                                'serverTime': moment().unix(),
                                'chn': driverObj.listner,
                                'ExpiryTimer': String(orderObj.dispatchSetting.driverAcceptTime),  //'30',
                                'distance': Number(result.distance) ? Number(parseFloat(result.distance).toFixed(2)) : 0,
                                'paymentType': orderObj.paymentType,
                                'payByWallet': orderObj.payByWallet,
                                'storeType': orderObj.storeType,
                                'deliveryFee': deliveryFees,
                                // 'deliveryFee': orderObj.deliveryCharge ? orderObj.deliveryCharge : 0,
                                'deliveryDatetime': orderObj.dueDatetime ? orderObj.dueDatetime : "",
                                'estimatedTime': result.duration ? result.duration : 0,
                                "currency": orderObj.currency ? orderObj.currency : "USD",
                                "currencySymbol": orderObj.currencySymbol ? orderObj.currencySymbol : "$",
                                "mileageMetric": orderObj.mileageMetric ? orderObj.mileageMetric : "km",
                                "bookingType": orderObj.bookingType ? orderObj.bookingType : "",
                                "isCominigFromStore": orderObj.isCominigFromStore ? orderObj.isCominigFromStore : 1,
                            };

                            pubnubContent.PingId = 1;

                            // notifyi.notifyRealTime({ 'listner': driverObj.listner, message: pubnubContent });
                            notifyi.notifyRealTime({ 'listner': driverObj.listner, message: { 'bookingData': pubnubContent } });
                            notifications.notifyFcmTopic({
                                action: 29,//for direct assign
                                usertype: 1,
                                deviceType: driverObj.mobileDevices.deviceType,
                                notification: "",
                                msg: request.i18n.__(request.i18n.__('bookingStatusMsg')['8d'], orderObj.orderId),
                                fcmTopic: driverObj.pushToken || '',
                                title: request.i18n.__(request.i18n.__('bookingStatusTitle')['8']),
                                data: { 'bookingData': pubnubContent }
                            }, () => { });

                            let dispatcherData = {
                                status: 8,
                                bid: request.payload.orderId,
                            };
                            //------sending notificaton to customer----------
                            let dispatcherData1 = {
                                status: 8,
                                statusMessage: 'Booking accepted by driver.',
                                statusMsg: 'Booking accepted by driver.',
                                bid: request.payload.orderId,
                            };
                            dispatcherData1.driverId = driverObj._id || ""
                            dispatcherData1.driverName = driverObj.firstName || ""
                            dispatcherData1.driverLName = driverObj.lastName || ""
                            dispatcherData1.driverImage = driverObj.profilePic || ""
                            dispatcherData1.totalAmount = orderObj ? orderObj.totalAmount : "";
                            dispatcherData1.bookingDate = orderObj ? orderObj.bookingDate : "";
                            dispatcherData1.storeName = orderObj ? orderObj.storeName : "";
                            dispatcherData1.serviceType = orderObj ? orderObj.serviceType : "";
                            dispatcherData1.pickupAddress = orderObj.pickup ? orderObj.pickup.addressLine1 : "";
                            dispatcherData1.dropAddress = orderObj.drop ? orderObj.drop.addressLine1 : "";
                            customer.getOne({ _id: orderObj.customerDetails ? new ObjectID(orderObj.customerDetails.customerId) : "" }, function (err, customerData) {
                                if (customerData.mqttTopic) {
                                    notifyi.notifyRealTime({ 'listner': customerData.mqttTopic, message: dispatcherData1 });
                                }
                                if (customerData.fcmTopic) {
                                    notifications.notifyFcmTopic({
                                        action: 11,
                                        usertype: 1,
                                        deviceType: customerData.mobileDevices ? customerData.mobileDevices.deviceType : 1,
                                        notification: "",
                                        msg: request.i18n.__(request.i18n.__('bookingStatusMsg')['8d'], driverObj.firstName, driverObj.countryCode, driverObj.mobile, config.appName),
                                        fcmTopic: customerData.fcmTopic || '',
                                        title: request.i18n.__(request.i18n.__('bookingStatusTitle')['8']),
                                        data: dispatcherData1
                                    }, () => {

                                    });
                                }
                            });


                            var dispatchCount = 1;
                            if (orderObj.dispatchCount) {
                                dispatchCount = orderObj.dispatchCount + 1;
                            }
                            orderObj.inDispatch = false;
                            orderObj.failedDispatch = true // yun 3g3 added
                            managerTopics.sendToWebsocket(orderObj, 2, (err, res) => {
                            });
                            let data = {
                                "driverId": driverObj._id,
                                "mobile": driverObj.mobile,
                                "fName": driverObj.firstName,
                                "lName": driverObj.lastName,
                                "image": driverObj.profilePic,
                                "email": driverObj.email,
                                "status": "Accepted",
                                "serverTime": moment().unix(),
                                "receiveDt": "",
                                "mqttTopic": driverObj.listner,
                                "fcmTopic": driverObj.pushToken,
                                "expiryTime": moment().unix() + orderObj.dispatchSetting.driverAcceptTime,
                                "driversLatLongs": driverObj.location.longitude + "/" + driverObj.location.latitude
                            }
                            let updateData = {
                                $set: {
                                    'status': parseInt(8),
                                    'driverId': new ObjectID(driverObj._id),
                                    "statusMsg": "Accepted",
                                    'isPopupShowing': false,
                                    'inDispatch': false, // yun ss added
                                    'driverDetails': {
                                        'driverId': new ObjectID(driverObj._id),
                                        'mobile': driverObj.mobile || '',
                                        'driverType': driverObj.driverType,//1 - freelancer, 3 - store driver
                                        'countryCode': driverObj.countryCode || '',
                                        'fName': driverObj.firstName,
                                        'chn': driverObj.publishChn || '',
                                        'lName': driverObj.lastName || '',
                                        'image': driverObj.profilePic || '',
                                        'email': driverObj.email || '',
                                        "mqttTopic": driverObj.listner || '', // channel of MQTT
                                        "fcmTopic": driverObj.pushToken || '', //push topic from FCM
                                        'LastTs': driverObj.lastTs || '',
                                        'app_version': driverObj.appVersion || '',
                                        'battery_Per': driverObj.batteryPer || '',
                                        'location_check': driverObj.locationCheck || '',
                                        'Device_type_': driverObj.mobileDevices.deviceType || '',
                                        'location_Heading': driverObj.locationHeading || '',
                                        'driversLatLongs': driverObj.location.latitude + ',' + driverObj.location.longitude,
                                        'operatorId': driverObj.companyId || ''
                                    },
                                    'masterPushTopic': driverObj.pushToken || '',
                                    'timeStamp.accepted': {                //timeStamp
                                        statusUpdatedBy: "driver",//dispatcher / driver / customer
                                        userId: new ObjectID(driverObj._id.toString()),
                                        timeStamp: timeStamp,
                                        isoDate: iso,
                                        location: {
                                            longitude: driverObj.location.longitude,
                                            latitude: driverObj.location.latitude
                                        },
                                        message: "Accepted",
                                        ip: "0.0.0.0"
                                    }
                                },
                                $push: {
                                    activityLogs: {                //timeStamp
                                        // accepted: {
                                        state: 'assign',
                                        statusUpdatedBy: "Dispatcher",//dispatcher / driver / customer
                                        userId: "",
                                        timeStamp: timeStamp,
                                        isoDate: iso,
                                        location: {
                                            longitude: driverObj.location.longitude,
                                            latitude: driverObj.location.latitude
                                        },
                                        message: "Accepted",
                                        ip: "0.0.0.0"
                                        // }
                                    },
                                    "dispatched": data
                                }
                            }
                            bookingsUnassigned.UpdatePush({ "orderId": request.payload.orderId }, updateData, function (err, result1) {

                                orders.getOrder({ orderId: request.payload.orderId }, 'unassignOrders', (err, orderObj) => {

                                    webSocket.publish('orderUpdates', orderObj, { qos: 2 }, function (mqttErr, mqttRes) {
                                    });

                                    let log = {
                                        "bookingId": orderObj.orderId,
                                        "bookingType": orderObj.bookingType,
                                        "dispatchedBy": 1,
                                        "serviceType": orderObj.serviceType,
                                        "dispatcherId": orderObj.managerLogs ? orderObj.managerLogs[0].managerId : "",
                                        "customerName": orderObj.customerDetails.name,
                                        "customerId": orderObj.customerDetails.customerId,
                                        "providerName": orderObj.storeName,
                                        "dispatchMode": orderObj.dispatchSetting.dispatchMode,
                                        "providerId": orderObj.storeId,
                                        "managerName": orderObj.managerLogs ? orderObj.managerLogs[0].managerName : "",
                                        "dispatchedByServerAt": moment().unix(),
                                        "expiryTimestamp": moment().unix() + orderObj.dispatchSetting.driverAcceptTime,
                                        "status": 1,
                                        "statusMsg": "order sent to driver",
                                        "driverName": driverObj.firstName + ' ' + driverObj.lastName,
                                        "driverId": driverObj._id
                                    }

                                    dispatchLogs.insert(log, function (err, result) {

                                    })

                                    webSocket.publish('dispatchLog', log, { qos: 2 }, function (mqttErr, mqttRes) {
                                    });

                                    orderObj.errNum = 200;
                                    let shiftBookingData = () => {
                                        return new Promise((resolve, reject) => {
                                            let conditionData = {
                                                'orderId': request.payload.orderId
                                            };
                                            bookingsUnassigned.SelectOne(conditionData, function (err, bookingDataFull) {
                                                if (err) {
                                                    reject(dbErrResponse);
                                                } else if (bookingDataFull) {
                                                    bookingDataFull.inDispatch = false
                                                    delete bookingDataFull.failedDispatch;
                                                    bookingsAssigned.createNewBooking(bookingDataFull)
                                                        .then((result) => {
                                                            bookingsUnassigned.Remove(conditionData, function (err, res) {
                                                                if (err) {
                                                                    reject(dbErrResponse);
                                                                } else {
                                                                    resolve({ message: request.i18n.__('postRespondTo')['200'], code: 200 });
                                                                }
                                                            });
                                                        })
                                                        .catch((err) => {
                                                            reject(dbErrResponse);
                                                        });
                                                } else {
                                                    reject({ message: request.i18n.__('postRespondTo')['404'], code: 404 });
                                                }
                                            });
                                        });
                                    };
                                    let updateLogs = () => {
                                        return new Promise((resolve, reject) => {
                                            let currentBookings = driverObj.currentBookings || [];
                                            currentBookings.push({ bid: orderObj.orderId });//push the current booking

                                            //log the booking activity
                                            // LogBookingActivity(
                                            //     currentBookings,
                                            //     {
                                            //         bid: bookingData.orderId,
                                            //         status: 8,
                                            //         msg: 'Booking accepted by driver.',
                                            //         time: timeStamp,
                                            //         isoDate: iso,
                                            //         lat: req.payload.lat || '',
                                            //         long: req.payload.long || ''
                                            //     }, () => {
                                            //     });

                                            //if Ride Booking then make  driver as Busy
                                            var busyInRide = 0;
                                            if (orderObj.serviceType == 2 && orderObj.appt_type == 1)
                                                busyInRide = 1;

                                            //set onJob flag & currentBookings
                                            drivers.FINDONEANDUPDATE({
                                                query: { _id: new ObjectID(driverObj._id.toString()) },
                                                data: {
                                                    $inc: { currentBookingsCount: 1 },
                                                    $set: { onJob: true, busyInRide: busyInRide, apptStatus: 8 },
                                                    $push: { currentBookings: { bid: orderObj.orderId, time: timeStamp, isoDate: iso } }
                                                }
                                            }, () => {
                                            });
                                            resolve(true);
                                        });
                                    };
                                    shiftBookingData()
                                        .then(updateLogs)
                                        .then(data => {
                                            return reply({ message: request.i18n.__('driverList')['200'], data: orderObj }).code(200);
                                        }).catch(e => {
                                            return reply({ message: request.i18n.__('driverList')['200'], data: orderObj }).code(200);
                                        })


                                })

                            })


                        })
                    }
                }

            })
        })
    } else {
        orders.getOrder({ orderId: request.payload.orderId }, 'unassignOrders', (err, orderObj) => {
            if (err) return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);

            drivers.getDriver({ "_id": new ObjectID(request.payload.driverId), status: 3 }, (err, driverObj) => {
                if (err) return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);

                if (!driverObj) {
                    return reply({ message: request.i18n.__('driverList')['200'], data: { errNum: 201, errMSg: "driver not available" } }).code(200);
                } else {
                    if (driverObj.wallet.hardLimitHit == true && orderObj.paymentType == 2) {
                        return reply({ message: request.i18n.__('driverList')['200'], data: { errNum: 202, errMSg: "Driver HardLimit Hit" } }).code(200);
                    } else {
                        let data = {
                            driverLocation: driverObj.location,
                            storeLocation: orderObj.storeCoordinates
                        }


                        distanceMatrix(data, (err, result) => {
                            if (err) {
                                return reply({ message: request.i18n.__('driverList')['200'], data: { errNum: 201, errMSg: "not available to dispatch" } }).code(200);
                            }

                            // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);

                            const pubnubContent = {
                                'action': 11,
                                'orderDatetime': orderObj.orderDatetime ? orderObj.orderDatetime : "",
                                'orderDateTimeStamp': orderObj.bookingDateTimeStamp ? orderObj.bookingDateTimeStamp : 0,
                                'dueDatetimeTimeStamp': orderObj.dueDatetimeTimeStamp ? orderObj.dueDatetimeTimeStamp : 0,
                                'amount': orderObj.totalAmount ? orderObj.totalAmount : "",
                                'orderId': orderObj.orderId ? orderObj.orderId : "",
                                'storeName': orderObj.storeName ? orderObj.storeName : "",
                                'bookingType': orderObj.bookingType ? orderObj.bookingType : "",
                                'pickUpAddress': orderObj.pickup.addressLine1 ? orderObj.pickup.addressLine1 : "",
                                'deliveryAddress': (orderObj.drop.flatNumber != "" ? orderObj.drop.flatNumber + "," : "") + (orderObj.drop.landmark != "" ? orderObj.drop.landmark + "," : "") + (orderObj.drop.addressLine1 != "" ? orderObj.drop.addressLine1 + "," : "") + (orderObj.drop.addressLine2 != "" ? orderObj.drop.addressLine2 + "," : "") + (orderObj.drop.city != "" ? orderObj.drop.city + "," : "") + (orderObj.drop.state != "" ? orderObj.drop.state : "") + (orderObj.drop.postalCode != "" ? "-" + orderObj.drop.postalCode : ""),
                                'customerName': orderObj.customerDetails.name,//orderObj.name,
                                'customerEmail': orderObj.customerDetails.email,//orderObj.email,
                                'customerMobile': orderObj.customerDetails.mobile,//orderObj.mobile,
                                'serverTime': moment().unix(),
                                'chn': driverObj.listner,
                                'ExpiryTimer': orderObj.dispatchSetting.driverAcceptTime ? String(orderObj.dispatchSetting.driverAcceptTime) : '30',
                                'distance': Number(result.distance) ? Number(parseFloat(result.distance).toFixed(2)) : 0,
                                'paymentType': orderObj.paymentType,
                                'deliveryFee': orderObj.deliveryCharge ? orderObj.deliveryCharge : 0,
                                'deliveryDatetime': orderObj.dueDatetime ? orderObj.dueDatetime : "",
                                'estimatedTime': result.duration ? result.duration : 0,
                                "currency": orderObj.currency ? orderObj.currency : "USD",
                                "currencySymbol": orderObj.currencySymbol ? orderObj.currencySymbol : "$",
                                "mileageMetric": orderObj.mileageMetric ? orderObj.mileageMetric : "km"
                            };

                            pubnubContent.PingId = 1;

                            // notifyi.notifyRealTime({ 'listner': driverObj.listner, message: pubnubContent });
                            notifyi.notifyRealTime({ 'listner': driverObj.listner, message: { 'bookingData': pubnubContent } });

                            notifications.notifyFcmTopic({
                                action: 11,
                                usertype: 1,
                                deviceType: driverObj.mobileDevices.deviceType,
                                notification: "",
                                //status.status(2, ""),
                                msg: request.i18n.__(request.i18n.__('bookingStatusMsg')[orderObj.status], orderObj.orderId),
                                fcmTopic: driverObj.pushToken || '',
                                title: request.i18n.__(request.i18n.__('bookingStatusTitle')[orderObj.status]),
                                data: { 'bookingData': pubnubContent }
                            }, () => { });
                            client.exists("did_" + driverObj._id, function (err, reply) {
                                if (reply !== 1) {
                                    var bookingExpirePopup = orderObj.dispatchSetting.driverAcceptTime || 30; //30;
                                    //   prolist.push(driverObj._id.toString());

                                    client.hmset('que_' + request.payload.orderId, 'prolist', "");
                                    client.expire('que_' + request.payload.orderId, bookingExpirePopup);
                                    client.setex('bid_' + request.payload.orderId, bookingExpirePopup, driverObj._id.toString(), function (err, result) { });
                                    client.setex('did_' + driverObj._id.toString(), bookingExpirePopup, parseInt(request.payload.orderId), function (err, result) { });
                                }
                            });

                            var dispatchCount = 1;
                            if (orderObj.dispatchCount) {
                                dispatchCount = orderObj.dispatchCount + 1;
                            }

                            let data = {
                                "driverId": driverObj._id,
                                "mobile": driverObj.mobile,
                                "fName": driverObj.firstName,
                                "lName": driverObj.lastName,
                                "image": driverObj.profilePic,
                                "email": driverObj.email,
                                "status": 1,
                                "serverTime": moment().unix(),
                                "receiveDt": "",
                                "mqttTopic": driverObj.listner,
                                "fcmTopic": driverObj.pushToken,
                                "expiryTime": moment().unix() + orderObj.dispatchSetting.driverAcceptTime,
                                "driversLatLongs": driverObj.location.longitude + "/" + driverObj.location.latitude
                            }

                            bookingsUnassigned.UpdatePush({ "orderId": request.payload.orderId }, { $push: { "dispatched": data }, $set: { inDispatch: true, status: 40, statusMsg: request.i18n.__(request.i18n.__('bookingStatusMsg')['40s']), statusText: request.i18n.__(request.i18n.__('bookingStatusMsg')['40s']), dispatchCount: dispatchCount } }, function (err, result1) {

                                orders.getOrder({ orderId: request.payload.orderId }, 'unassignOrders', (err, orderObj) => {

                                    webSocket.publish('orderUpdates', orderObj, { qos: 2 }, function (mqttErr, mqttRes) {
                                    });

                                    let log = {
                                        "bookingId": orderObj.orderId,
                                        "bookingType": orderObj.bookingType,
                                        "dispatchedBy": 1,
                                        "serviceType": orderObj.serviceType,
                                        "dispatcherId": orderObj.managerLogs ? orderObj.managerLogs[0].managerId : "",
                                        "customerName": orderObj.customerDetails.name,
                                        "customerId": orderObj.customerDetails.customerId,
                                        "providerName": orderObj.storeName,
                                        "dispatchMode": orderObj.dispatchSetting.dispatchMode,
                                        "providerId": orderObj.storeId,
                                        "managerName": orderObj.managerLogs ? orderObj.managerLogs[0].managerName : "",
                                        "dispatchedByServerAt": moment().unix(),
                                        "expiryTimestamp": moment().unix() + orderObj.dispatchSetting.driverAcceptTime,
                                        "status": 1,
                                        "statusMsg": "order sent to driver",
                                        "driverName": driverObj.firstName + ' ' + driverObj.lastName,
                                        "driverId": driverObj._id
                                    }

                                    dispatchLogs.insert(log, function (err, result) {

                                    })

                                    webSocket.publish('dispatchLog', log, { qos: 2 }, function (mqttErr, mqttRes) {
                                    });

                                    orderObj.errNum = 200;
                                    return reply({ message: request.i18n.__('driverList')['200'], data: orderObj }).code(200);

                                })

                            })


                        })
                    }
                }

            })
        })
    }


}

function distanceMatrix(data, callback) {
    // var distance = require('google-distance-matrix');
    // distance.key('AIzaSyAh-Xumt2YZHJZhYj9D1KhKrEZC0VfUTpg');
    // distance.mode('driving');
    // distance.units('imperial');

    let origins = [];
    let destinations = [];

    let latLong = data.driverLocation.latitude + "," + data.driverLocation.longitude
    origins.push(latLong.toString());

    let dlatlong = data.storeLocation.latitude + "," + data.storeLocation.longitude;
    destinations.push(dlatlong.toString());

    googleApi.calculateDistance(origins, destinations, [], [])
        .then((data1) => {

            callback(null, { "duration": data1.duration, "distance": Number(data1.distance / 1000) });

            //  tripTime = data1.duration / 60;// conveting to minutes
            //  tripDistance = data1.distance / parseFloat(pickupCityData.distanceMetricsUnit);// Conveting to distance Matrix Unit 

            //  resolve(true);
            // }).catch((err) => {
            //     logger.error(err);
            //     reject({ message: req.i18n.__('customerFareEstimateRide')['407'], code: 407 });
            // });


            // distance.matrix(origins, destinations, function (err, distances) {
            //     if (err) {
            //     }
            //     if (!distances) {
            //     }
            //     if (distances.status == 'OK') {
            //         for (var i = 0; i < origins.length; i++) {
            //             for (var j = 0; j < destinations.length; j++) {
            //                 var origin = distances.origin_addresses[i];
            //                 var destination = distances.destination_addresses[j];

            //                 if (distances.rows[0].elements[j].status == 'OK') {

            //                     var distance = distances.rows[i].elements[j].distance.text;
            //                     var duration = distances.rows[i].elements[j].duration.value;

            //                     var distancelocation = distances.rows[i].elements[j].distance.value;
            //                     distancelocation = distancelocation / 1000;
            //                     distancelocation = parseFloat(distancelocation).toFixed(2);

            //                     callback(null, { "duration": duration, "distance": Number(distancelocation) });

            //                 } else {

            //                     callback(err, distances)

            //                 }
            //             }
            //         }
            //     }
            // });
        }).catch((err) => {
            callback(err, null);
        })
}


/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    orderId: Joi.number().integer().required().description('storeId'),
    driverId: Joi.string().required().description('driverId'),
    timestamp: Joi.string().required().description('timestamp'),
    dispatchType: Joi.number().allow('').description('For 1: Request Order <br/> 2: Assign Order'),
}


/**
* A module that exports customer get cart handler, get cart validator! 
* @exports handler 
*/
module.exports = { handler, validator }