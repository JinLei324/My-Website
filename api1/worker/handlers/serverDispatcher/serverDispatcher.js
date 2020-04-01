'use strict'

var async = require("async");
var moment = require('moment');
const logger = require('winston');
var config = require('../../../config');
// var stripeNew = require('../../../library/stripe');
var appConfig = require('../../../models/appConfig');
var notifications = require('../../../library/fcm');
var notifyi = require('../../../library/mqttModule/mqtt');
var bookingsUnassigned = require('../../../models/bookingsUnassigned');
var dispatchLogs = require('../../../models/dispatchLogs');
var provider = require('../../../models/driver');
const zonesDeliverySlots = require('../../../models/zonesDeliverySlots');
const webSocket = require('../../../library/websocket/websocket');
const redis = require('../../../library/redis');
let client = redis.client;
const i18n = require('../../../locales/locales');

const rabbitMq = require('../../../library/rabbitMq');


const stores = require('../../../models/stores');

var ObjectID = require('mongodb').ObjectID;
var geo = require('georedis').initialize(client);

var serverDispatcher = module.exports = {};
let zoneDeliveryData = {};
var geoNearOptions = {
    withCoordinates: true, // Will provide coordinates with locations, default false
    withHashes: true, // Will provide a 52bit Geohash Integer, default false
    withDistances: true, // Will provide distance from query, default false
    order: 'ASC', // or 'DESC' or true (same as 'ASC'), default false
    units: 'm', // or 'km', 'mi', 'ft', default 'm'
    count: 100, // Number of results to return, default undefined
    accurate: true // Useful if in emulated mode and accuracy is important, default false
}

/**
 * Check for Booking is there for the driver
 * @param {*} masId - driver ID
 * @param {*} typeId - vehicle type id
 * @param {*} locations - location obj from redis-geo
 * @param {*} index - index of near by booking (redis-geo)
 */
function checkAndSendBooking(masId, locations, index) {
    if (locations.length > index) {
        var location = locations[index];
        var locdata = location.key.split("_");
        client.exists("que_" + locdata[1], function (err, reply) {
            if (reply == 1) {
                client.hgetall('que_' + locdata[1], function (err, object) {
                    var proListArr = object.prolist.split(",");
                    if (proListArr.indexOf(masId) > -1) {
                        checkAndSendBooking(masId, locations, index + 1);
                    } else {
                        client.exists("bid_" + locdata[1], function (err, bidreply) {
                            if (err)
                                checkAndSendBooking(masId, locations, index + 1);
                            if (bidreply !== 1) {
                                //send booking here
                                // if (typeId == object.typeId) {
                                serverDispatcher.isAnyOtherDriverAvailable(locdata[1], function (err, back) { });
                                // proListArr.push(masId);
                                // client.hmset('que_' + locdata[1], 'prolist', proListArr.join(","));
                                // client.setex('bid_' + locdata[1], object.driverAcceptTime, masId, function (err, result) {
                                //     client.setex('did_' + masId.toString(), object.driverAcceptTime, parseInt(locdata[1]), function (err, result) {
                                //         // sendBookingToMaster(masId, locdata[1]);
                                //     });
                                // });
                                // } else {
                                //     checkAndSendBooking(masId, locations, index + 1);
                                // }
                            } else {
                                checkAndSendBooking(masId, locations, index + 1);
                            }
                        });
                    }
                });
            } else {
                checkAndSendBooking(masId, locations, index + 1);
            }
        });
    }
}

/**
 * Check for booking for Driver when location update
 * @param {*} masId driver id
 * @param {*} lat latitude
 * @param {*} lng longitude
 * @param {*} typeId vehicle type id
 * @param {*} callback 
 */
serverDispatcher.masterLocationUpdated = function (masId, lat, lng, callback) {
    client.exists("did_" + masId, function (err, didreply) {
        // if (err) {
        //     return callback(err);
        // }

        if (didreply !== 1) {
            geo.nearby({ latitude: lat, longitude: lng }, 20000, geoNearOptions, function (err, locations) {
                if (err)
                    return callback(err);
                else {
                    if (locations.length > 0) {
                        checkAndSendBooking(masId, locations, 0);
                    } else {
                        return callback(null, "There is no booking for you");
                    }
                }
            });
        } else {
            return callback(null, "Master have already booking popup showing");
        }
    });

}

/**
 * Chcek driver and send booking to driver (only for new booking)
 * @param {*} bId Booking Id
 * @param {*} callback 
 */
serverDispatcher.nowBooking = function (bId, callback) {

    bookingsUnassigned.SelectOne({ orderId: bId }, function (err, bookingdata) {
        if (err) {
            return callback(err);
        } else {
            if (!bookingdata) {
                return callback("Booking Not Found");
            }

            client.exists("que_" + bId, function (err, didreply) {
                if (err)
                    return callback(err);
                if (didreply == 1) {
                    return callback(null, "This boooking already in Queue");
                } else {
                    if (bookingdata.storeType == 5) {
                        bookingdata.storeCoordinates.latitude = bookingdata.customerCoordinates.latitude;
                        bookingdata.storeCoordinates.longitude = bookingdata.customerCoordinates.longitude;
                    }
                    logger.info("step10------------------------------------");

                    var latitude = (typeof bookingdata.storeCoordinates.latitude == "undefined" ? "" : bookingdata.storeCoordinates.latitude);
                    var longitude = (typeof bookingdata.storeCoordinates.longitude == "undefined" ? "" : bookingdata.storeCoordinates.longitude);
                    // var pickupzoneId = (typeof bookingdata.pickupzoneId == "undefined" ? "" : bookingdata.pickupzoneId);
                    // var dorpzoneId = (typeof bookingdata.dorpzoneId == "undefined" ? "" : bookingdata.dorpzoneId);
                    // var type_id = (typeof bookingdata.type_id == "undefined" ? "" : bookingdata.type_id);
                    var storeId = (typeof bookingdata.storeId == "undefined" ? "" : bookingdata.storeId);
                    // var slave_id = (typeof bookingdata.slave_id == "undefined" ? "" : bookingdata.slave_id);
                    var userId = (typeof bookingdata.customerDetails.customerId == "undefined" ? "" : bookingdata.customerDetails.customerId);
                    var timeForDriverAck = (typeof bookingdata.dispatchSetting.timeForDriverAck == "undefined" ? 20 : bookingdata.dispatchSetting.timeForDriverAck);
                    var driverAcceptTime = (typeof bookingdata.dispatchSetting.driverAcceptTime == "undefined" ? 30 : bookingdata.dispatchSetting.driverAcceptTime);
                    var DispatchRadius = (typeof bookingdata.dispatchSetting.DispatchRadius == "undefined" ? 20 : bookingdata.dispatchSetting.DispatchRadius);
                    var ExpriryTime = (typeof bookingdata.AutoDispatchExpriryTime == "undefined" ? 60 : bookingdata.AutoDispatchExpriryTime);
                    var slavePushToken = (typeof bookingdata.customerDetails.fcmTopic == "undefined" ? "" : bookingdata.customerDetails.fcmTopic);
                    var customerDeviceId = (typeof bookingdata.customerDetails.deviceId == "undefined" ? "" : bookingdata.customerDetails.deviceId);
                    // var customerDeviceId = (typeof bookingdata.devices.deviceId == "undefined" ? "" : bookingdata.devices.deviceId);
                    // var appt_type = (typeof bookingdata.appt_type == "undefined" ? 1 : bookingdata.appt_type);
                    var serviceType = (typeof bookingdata.serviceType == "undefined" ? "" : bookingdata.serviceType);
                    var bookingType = (typeof bookingdata.bookingType == "undefined" ? "" : bookingdata.bookingType);
                    var paymentType = (typeof bookingdata.paymentType == "undefined" ? 1 : bookingdata.paymentType);
                    var dispatchMode = (typeof bookingdata.dispatchSetting.dispatchMode == "undefined" ? 0 : bookingdata.dispatchSetting.dispatchMode);
                    var forcedAccept = (typeof bookingdata.forcedAccept == "undefined" ? 1 : bookingdata.forcedAccept);
                    var driverType = (typeof bookingdata.driverType == "undefined" ? 2 : bookingdata.driverType);
                    var cityId = (typeof bookingdata.cityId == "undefined" ? "" : bookingdata.cityId);
                    var dropZoneId = (typeof bookingdata.drop.dropZone == "undefined" ? 2 : bookingdata.drop.dropZone);
                    client.hmset('que_' + bId,
                        'prolist', "",
                        'status', 1,
                        'latitude', latitude,
                        'longitude', longitude,
                        //     'pickupzoneId', pickupzoneId.toString(),
                        //    'dorpzoneId', dorpzoneId.toString(),
                        //    'typeId', type_id.toString(),
                        //   'slave_id', slave_id.toString(),
                        'storeId', storeId,
                        'userId', userId,
                        'timeForDriverAck', timeForDriverAck,
                        'driverAcceptTime', driverAcceptTime,
                        'ExpriryTime', ExpriryTime,
                        'customerToken', slavePushToken,
                        //  'slaveChn', slaveDeviceId,
                        'customerChn', customerDeviceId,
                        'serviceType', serviceType,
                        // 'appt_type', appt_type,
                        'bookingType', bookingType,
                        'paymentType', paymentType,
                        'dispatchMode', dispatchMode,
                        'bookingExpirePopup', driverAcceptTime,
                        'forcedAccept', forcedAccept,
                        'driverType', driverType,
                        'DispatchRadius', DispatchRadius,
                        'dropZoneId', dropZoneId,
                        'cityId', cityId
                    );
                    client.expire('que_' + bId, ExpriryTime);
                    geo.addLocation('location_' + bId, { latitude: bookingdata.storeCoordinates.latitude, longitude: bookingdata.storeCoordinates.longitude }, function (err, reply) {
                        if (err)
                            return callback(err);
                        else {
                            serverDispatcher.isAnyOtherDriverAvailable(bId, function (err, back) { });
                            return callback(null, "Booking successfully Created");
                        }

                    });
                }
            });
        }
    });
}

/**
 * Chcek driver and send booking to driver (only for new later booking)
 * @param {*} bId Booking Id
 * @param {*} callback 
 */
serverDispatcher.laterBooking = function (bId, callback) {

    bookingsUnassigned.SelectOne({ orderId: bId }, function (err, bookingdata) {
        if (err) {
            return callback(err);
        } else {
            if (!bookingdata)
                return callback("Booking Not Found");
            client.exists("laterQue_" + bId, function (err, didreply) {
                if (err)
                    return callback(err);
                if (didreply == 1) {
                    return callback(null, "This boooking already in Queue");
                } else {
                    client.setex('laterQue_' + bId, bookingdata.dispatchSetting.laterBookingStartTime, moment().unix(), function (err, result) { });
                    return callback(null, "Later Booking successfully Created");
                }
            });
        }
    });
}


/**
 * Booking Action For Deleting Booking data from redis
 * @param {*} bId booking Id
 * @param {*} masId driver id
 * @param {*} status [1- Reject by driver, 2- accept by driver, 3- booking request cancel by customer]
 * @param {*} callback 
 */
serverDispatcher.bookingAction = function (bId, masId, status, callback) {

    switch (parseInt(status)) {
        case 1:
            client.del('bid_' + bId, function (err, reply) { });
            client.del('did_' + masId, function (err, reply) { });
            // serverDispatcher.isAnyOtherDriverAvailable(bId, function (err, back) { });
            var bookingData = {
                'bid': parseInt(bId)
            };
            rabbitMq.sendToQueue(rabbitMq.queueRetry, bookingData, (err, doc) => {
            });
            break;
        case 11:
            client.del('bid_' + bId, function (err, reply) { });
            client.del('did_' + masId, function (err, reply) { });
            client.del('que_' + bId, function (err, reply) { });
            // serverDispatcher.isAnyOtherDriverAvailable(bId, function (err, back) { });
            break;
        case 2:
            client.del('que_' + bId, function (err, reply) { });
            client.del('bid_' + bId, function (err, reply) { });
            client.del('did_' + masId, function (err, reply) { });
            geo.removeLocation('location_' + bId, function (err, reply) {
                if (err)
                    console.error(err);
            });
            // client.del('centralQue_' + bId, function (err, reply) { });
            break;
        case 3:
            client.del('que_' + bId, function (err, reply) { });
            client.del('bid_' + bId, function (err, reply) { });
            client.del('did_' + masId.toString(), function (err, reply) { });
            geo.removeLocation('location_' + bId, function (err, reply) {
                if (err)
                    console.error(err);
            });
            // client.del('centralQue_' + bId, function (err, reply) { });
            break;
        default:
            break;
    }
    callback(null, 'booking status updated');
}

/**
 * Send Booking to Central Dispatcher
 * @param {*} bId booking id
 * @param {*} callback 
 */
serverDispatcher.bookingToCentralDispatcher = function (bId, callback) {

    bookingsUnassigned.SelectOne({ order_id: parseInt(bId) }, function (err, bookingdata) {
        if (err) {
            return callback(err);
        } else {

            if (!bookingdata)
                return callback("Booking Not Found");

            // client.setex('centralQue_' + bId, bookingdata.dispatchSetting.centralDispatchExpiryTime, moment().unix(), function (err, result) {
            // });

            return callback(null, "Central Booking successfully Created");
        }
    });
}

/**
 * Check for next available driver for the booking
 * @param {*} bid booking id
 * @param {*} LastCall callback
 */
serverDispatcher.isAnyOtherDriverAvailable = function (bid, LastCall) {
    let object = {};
    var bookingExpirePopup = 30;
    async.waterfall(
        [
            // function (callback) {
            //     appConfig.getOne({}, (err, appConfigObj) => {
            //         bookingExpirePopup = appConfigObj.dispatch_settings.driverAcceptTime;
            //         callback();
            //     })
            // },

            function (callback) {

                client.hgetall('que_' + bid, function (err, objectRedis) {
                    object = objectRedis;
                    if (object == null) {
                        callback(null, 0, 0);
                    } else {

                        bookingExpirePopup = object.driverAcceptTime;


                        var DriverList = [];
                        var prolist = object.prolist.split(",").map(function (item) {
                            if (item)
                                DriverList.push(new ObjectID(item));
                            return item;
                        });


                        client.keys('did_*', function (err, keys) {

                            var DriverArray = [];
                            async.each(keys, function (orderitem, arraycallback) {
                                DriverArray.push(new ObjectID(orderitem.split('_').pop()));
                                arraycallback();
                            }, function (err) {


                                DriverArray = DriverArray.concat(DriverList);
                                var loc = { lat: object.latitude, lng: object.longitude };

                                let query;
                                if (object.driverType == 2) {  //store drivers
                                    query = { status: 3, _id: { $nin: DriverArray }, storeId: new ObjectID(object.storeId), driverType: 2 }
                                } else { //free lancer 
                                    query = { status: 3, _id: { $nin: DriverArray }, driverType: 1 }
                                }
                                if (object.cityId != "" && typeof object.cityId != "undefined") {
                                    query.cityId = object.cityId;
                                }
                                if (object.dropZoneId != "" && typeof object.dropZoneId != "undefined") {
                                    query.serviceZones = { "$in": [object.dropZoneId] };
                                }
                                let distance = object.DispatchRadius;
                                //finding drivers  
                                // { status: 3,
                                //     _id: { '$nin': [ 5dcc0d24087d9256ee54f5b7 ] },
                                //     driverType: 1 }

                                provider.GeoNearCond(query, loc, distance, function (err, res) {  //type: new ObjectID(object.typeId)

                                    if (err) {
                                        logger.error("Error 3");
                                    } else {
                                        if (res.length > 0) {
                                            var item = 0;
                                            // async.forEach(res.results, function (driverData, callbackloop) {
                                            //     if (typeof driverData.obj.zones != 'undefined')
                                            //         if (driverData.obj.zones.indexOf(object.dorpzoneId) !== -1) {
                                            //             item = driverData;
                                            //         }
                                            //     callbackloop(null);
                                            // }, function (loopErr) {
                                            item = (item == 0 ? res[0] : item);
                                            callback(null, item, prolist);
                                            //});
                                        } else {
                                            callback(null, 0, 0);
                                        }
                                    }
                                });
                            });
                        });
                    }
                });
            },
            function (item, prolist, secondCall) {


                if (item == 0) {
                    return secondCall(null, 0);
                } else {
                    client.exists("bid_" + bid, function (err, replybid) {
                        if (replybid !== 1) {
                            client.exists("did_" + item._id, function (err, reply) {
                                if (reply !== 1) {
                                    if (object.paymentType && object.paymentType == 2 && item.wallet && item.wallet.hardLimitHit && item.wallet.hardLimitHit == true) {
                                        console.log("HARD LIMIT HIT FOR  : ", item.firstName);
                                        if (object !== null) {
                                            geo.addLocation('location_' + bid, {
                                                latitude: object.latitude,
                                                longitude: object.longitude
                                            }, function (err, reply) { });
                                        }
                                        secondCall();
                                    } else {
                                        prolist.push(item._id.toString());
                                        client.hmset('que_' + bid, 'prolist', prolist.join(","));
                                        client.setex('bid_' + bid, bookingExpirePopup, item._id.toString(), function (err, result) { });
                                        client.setex('did_' + item._id.toString(), bookingExpirePopup, parseInt(bid), function (err, result) { });
                                        sendBookingToMaster(item._id, bid, item.distance);
                                        secondCall();
                                    }


                                } else
                                    secondCall();
                            });
                        } else {
                            logger.info("Booking All Ready In Dispatch");
                            secondCall();
                        }
                    });

                }
            }
        ],
        function (args) {
            return LastCall(null, bid);
        });
};

/**
 * send booking data to driver by MQTT and FCM
 * @param {*} masid driver id
 * @param {*} bId booking id
 */
function sendBookingToMaster(masid, bId, distance) {

    provider.SelectOne({ _id: new ObjectID(masid.toString()) }, function (err, item) {
        if (err) {
            logger.error('Error in sendBookingToMaster1');
        } else if (item) {


            bookingsUnassigned.SelectOne({ orderId: parseFloat(bId) }, function (err, booking) {

                if (err) {
                    logger.error('Error in sendBookingToMaster2');
                } else if (!booking) {
                    logger.error('booking not found');
                } else {

                    if (booking.storeType == 5) {
                        if (booking.isCominigFromStore) {
                            if (booking.storeType == 5) {
                                zonesDeliverySlots.getSlots(booking.pickupSlotId, (err, dataResponse1) => {
                                    if (err) {
                                        logger.error("Error while getting delivery slots data .... ");
                                    } else {
                                        zoneDeliveryData = dataResponse1;
                                        if (booking.status == 3) {
                                            client.del('que_' + bId, function (err, reply) { });
                                            client.del('bid_' + bId, function (err, reply) { });
                                        } else {

                                            // var data = {
                                            //     'DriverId': new ObjectID(item._id),
                                            //     'mobile': (typeof item.mobile == 'undefined') ? "" : item.mobile,
                                            //     'fName': (typeof item.firstName == 'undefined') ? "" : item.firstName,
                                            //     'lName': (typeof item.lastName == 'undefined') ? "" : item.lastName,
                                            //     'image': (typeof item.image == 'undefined') ? "" : item.image,
                                            //     'email': (typeof item.email == 'undefined') ? "" : item.email,
                                            //     'Status': "Not Received",
                                            //     'serverTime': moment().unix(),
                                            //     'receiveDt': "",
                                            //     "listenerChn": item.listner,
                                            //     "pushTopic": item.pushTopic,
                                            //     'ExpiryTime': moment().unix() + booking.driverAcceptTime,
                                            //     'DriversLatLongs': item.location.longitude + "/" + item.location.longitude.latitude
                                            // };
                                            // var data = {
                                            //         "driverId" : item._id,
                                            //         "mobile" : item.mobile,
                                            //         "fName" : item.firstName,
                                            //         "lName" : item.lastName,
                                            //         "image" : item.profilePic,
                                            //         "email" : item.email,
                                            //         "status" :1,
                                            //         "serverTime" : moment().unix(),
                                            //         "receiveDt" : "",
                                            //         "listenerChn": item.listner,
                                            //         "pushTopic": item.pushToken,
                                            //         "ExpiryTime" : moment().unix() + booking.driverAcceptTime,
                                            //         "Received_Act_serverTime" : "",
                                            //         "actPing" : 1,
                                            //         "rejectedTime" : "",
                                            //          'DriversLatLongs': item.location.longitude + "/" + item.location.latitude
                                            // }

                                            var data = {
                                                "driverId": item._id,
                                                "mobile": item.mobile,
                                                "fName": item.firstName,
                                                "lName": item.lastName,
                                                "image": item.profilePic,
                                                "email": item.email,
                                                "status": 1,
                                                "serverTime": moment().unix(),
                                                "receiveDt": "",
                                                "mqttTopic": item.listner,
                                                "fcmTopic": item.pushToken,
                                                "storeType": booking.storeType,
                                                "storeTypeMsg": booking.storeTypeMsg,
                                                "expiryTime": moment().unix() + booking.dispatchSetting.driverAcceptTime, //60
                                                "driversLatLongs": item.location.longitude + "/" + item.location.latitude
                                            }

                                            let log = {
                                                "bookingId": booking.orderId,
                                                "bookingType": booking.bookingType,
                                                "dispatchedBy": 1,
                                                "storeType": booking.storeType,
                                                "storeTypeMsg": booking.storeTypeMsg,
                                                "dispatcherId": booking.managerLogs ? booking.managerLogs[0].managerId : "",
                                                "customerName": booking.customerDetails.name,
                                                "customerId": booking.customerDetails.customerId,
                                                "managerName": booking.managerLogs ? booking.managerLogs[0].managerName : "",
                                                "dispatchMode": booking.dispatchSetting.dispatchMode,
                                                "providerName": booking.storeName,
                                                "providerId": booking.storeId,
                                                "serviceType": booking.serviceType,
                                                "dispatchedByServerAt": moment().unix(),
                                                "expiryTimestamp": moment().unix() + booking.dispatchSetting.driverAcceptTime,
                                                "status": 1,
                                                "statusMsg": "order sent to driver",
                                                "driverName": item.firstName + ' ' + item.lastName,
                                                "driverId": item._id
                                            }

                                            dispatchLogs.insert(log, function (err, result) {
                                            });

                                            webSocket.publish('dispatchLog', log, { qos: 2 }, function (mqttErr, mqttRes) {
                                            });

                                            var dispatchCount = 1;
                                            if (booking.dispatchCount) {
                                                dispatchCount = booking.dispatchCount + 1;
                                            }

                                            bookingsUnassigned.UpdatePush({ "orderId": parseFloat(bId) }, { $push: { "dispatched": data }, $set: { inDispatch: true, dispatchCount: dispatchCount } }, function (err, result1) {
                                                // bookingsUnassigned.UpdatePush({ "orderId": bId }, { "driversLog": data }, function (err, result1) {
                                                if (err) {
                                                    logger.error("booking_route Not Pushed : " + err);
                                                } else {
                                                    logger.info("Booking Sent TO 1: " + item.firstName);
                                                    sendRealTimeDataToProvider(booking, item, 60, 20, distance);
                                                }
                                            });
                                        }
                                    }
                                });
                            }
                        } else {
                            zonesDeliverySlots.getSlots(booking.dropSlotId, (err, dataResponse1) => {
                                if (err) {
                                    logger.error("Error while getting delivery slots data .... ");
                                } else {
                                    zoneDeliveryData = dataResponse1;
                                    if (booking.status == 3) {
                                        client.del('que_' + bId, function (err, reply) { });
                                        client.del('bid_' + bId, function (err, reply) { });
                                    } else {

                                        // var data = {
                                        //     'DriverId': new ObjectID(item._id),
                                        //     'mobile': (typeof item.mobile == 'undefined') ? "" : item.mobile,
                                        //     'fName': (typeof item.firstName == 'undefined') ? "" : item.firstName,
                                        //     'lName': (typeof item.lastName == 'undefined') ? "" : item.lastName,
                                        //     'image': (typeof item.image == 'undefined') ? "" : item.image,
                                        //     'email': (typeof item.email == 'undefined') ? "" : item.email,
                                        //     'Status': "Not Received",
                                        //     'serverTime': moment().unix(),
                                        //     'receiveDt': "",
                                        //     "listenerChn": item.listner,
                                        //     "pushTopic": item.pushTopic,
                                        //     'ExpiryTime': moment().unix() + booking.driverAcceptTime,
                                        //     'DriversLatLongs': item.location.longitude + "/" + item.location.longitude.latitude
                                        // };
                                        // var data = {
                                        //         "driverId" : item._id,
                                        //         "mobile" : item.mobile,
                                        //         "fName" : item.firstName,
                                        //         "lName" : item.lastName,
                                        //         "image" : item.profilePic,
                                        //         "email" : item.email,
                                        //         "status" :1,
                                        //         "serverTime" : moment().unix(),
                                        //         "receiveDt" : "",
                                        //         "listenerChn": item.listner,
                                        //         "pushTopic": item.pushToken,
                                        //         "ExpiryTime" : moment().unix() + booking.driverAcceptTime,
                                        //         "Received_Act_serverTime" : "",
                                        //         "actPing" : 1,
                                        //         "rejectedTime" : "",
                                        //          'DriversLatLongs': item.location.longitude + "/" + item.location.latitude
                                        // }

                                        var data = {
                                            "driverId": item._id,
                                            "mobile": item.mobile,
                                            "fName": item.firstName,
                                            "lName": item.lastName,
                                            "image": item.profilePic,
                                            "email": item.email,
                                            "status": 1,
                                            "serverTime": moment().unix(),
                                            "receiveDt": "",
                                            "mqttTopic": item.listner,
                                            "fcmTopic": item.pushToken,
                                            "storeType": booking.storeType,
                                            "storeTypeMsg": booking.storeTypeMsg,
                                            "expiryTime": moment().unix() + booking.dispatchSetting.driverAcceptTime, //60
                                            "driversLatLongs": item.location.longitude + "/" + item.location.latitude
                                        }

                                        let log = {
                                            "bookingId": booking.orderId,
                                            "bookingType": booking.bookingType,
                                            "dispatchedBy": 1,
                                            "storeType": booking.storeType,
                                            "storeTypeMsg": booking.storeTypeMsg,
                                            "dispatcherId": booking.managerLogs ? booking.managerLogs[0].managerId : "",
                                            "customerName": booking.customerDetails.name,
                                            "customerId": booking.customerDetails.customerId,
                                            "managerName": booking.managerLogs ? booking.managerLogs[0].managerName : "",
                                            "dispatchMode": booking.dispatchSetting.dispatchMode,
                                            "providerName": booking.storeName,
                                            "providerId": booking.storeId,
                                            "serviceType": booking.serviceType,
                                            "dispatchedByServerAt": moment().unix(),
                                            "expiryTimestamp": moment().unix() + booking.dispatchSetting.driverAcceptTime,
                                            "status": 1,
                                            "statusMsg": "order sent to driver",
                                            "driverName": item.firstName + ' ' + item.lastName,
                                            "driverId": item._id
                                        }

                                        dispatchLogs.insert(log, function (err, result) {
                                        });

                                        webSocket.publish('dispatchLog', log, { qos: 2 }, function (mqttErr, mqttRes) {
                                        });

                                        var dispatchCount = 1;
                                        if (booking.dispatchCount) {
                                            dispatchCount = booking.dispatchCount + 1;
                                        }

                                        bookingsUnassigned.UpdatePush({ "orderId": parseFloat(bId) }, { $push: { "dispatched": data }, $set: { inDispatch: true, dispatchCount: dispatchCount } }, function (err, result1) {
                                            // bookingsUnassigned.UpdatePush({ "orderId": bId }, { "driversLog": data }, function (err, result1) {
                                            if (err) {
                                                logger.error("booking_route Not Pushed : " + err);
                                            } else {
                                                logger.info("Booking Sent TO 2: " + item.firstName);
                                                sendRealTimeDataToProvider(booking, item, 60, 20, distance);
                                            }
                                        });
                                    }
                                }
                            });
                        }
                    } else {
                        //   if (item.busyInRide != 'undefined' && item.busyInRide == 1 && booking.service_type == 2)
                        //     {
                        //        logger.info('master is busy in Ride Booking');
                        //     } 
                        //   else 

                        if (booking.status == 3) {
                            client.del('que_' + bId, function (err, reply) { });
                            client.del('bid_' + bId, function (err, reply) { });
                        } else {

                            // var data = {
                            //     'DriverId': new ObjectID(item._id),
                            //     'mobile': (typeof item.mobile == 'undefined') ? "" : item.mobile,
                            //     'fName': (typeof item.firstName == 'undefined') ? "" : item.firstName,
                            //     'lName': (typeof item.lastName == 'undefined') ? "" : item.lastName,
                            //     'image': (typeof item.image == 'undefined') ? "" : item.image,
                            //     'email': (typeof item.email == 'undefined') ? "" : item.email,
                            //     'Status': "Not Received",
                            //     'serverTime': moment().unix(),
                            //     'receiveDt': "",
                            //     "listenerChn": item.listner,
                            //     "pushTopic": item.pushTopic,
                            //     'ExpiryTime': moment().unix() + booking.driverAcceptTime,
                            //     'DriversLatLongs': item.location.longitude + "/" + item.location.longitude.latitude
                            // };
                            // var data = {
                            //         "driverId" : item._id,
                            //         "mobile" : item.mobile,
                            //         "fName" : item.firstName,
                            //         "lName" : item.lastName,
                            //         "image" : item.profilePic,
                            //         "email" : item.email,
                            //         "status" :1,
                            //         "serverTime" : moment().unix(),
                            //         "receiveDt" : "",
                            //         "listenerChn": item.listner,
                            //         "pushTopic": item.pushToken,
                            //         "ExpiryTime" : moment().unix() + booking.driverAcceptTime,
                            //         "Received_Act_serverTime" : "",
                            //         "actPing" : 1,
                            //         "rejectedTime" : "",
                            //          'DriversLatLongs': item.location.longitude + "/" + item.location.latitude
                            // }

                            var data = {
                                "driverId": item._id,
                                "mobile": item.mobile,
                                "fName": item.firstName,
                                "lName": item.lastName,
                                "image": item.profilePic,
                                "email": item.email,
                                "status": 1,
                                "serverTime": moment().unix(),
                                "receiveDt": "",
                                "mqttTopic": item.listner,
                                "fcmTopic": item.pushToken,
                                "storeType": booking.storeType,
                                "storeTypeMsg": booking.storeTypeMsg,
                                "expiryTime": moment().unix() + booking.dispatchSetting.driverAcceptTime, //60
                                "driversLatLongs": item.location.longitude + "/" + item.location.latitude
                            }

                            let log = {
                                "bookingId": booking.orderId,
                                "bookingType": booking.bookingType,
                                "dispatchedBy": 1,
                                "storeType": booking.storeType,
                                "storeTypeMsg": booking.storeTypeMsg,
                                "dispatcherId": booking.managerLogs ? booking.managerLogs[0].managerId : "",
                                "customerName": booking.customerDetails.name,
                                "customerId": booking.customerDetails.customerId,
                                "managerName": booking.managerLogs ? booking.managerLogs[0].managerName : "",
                                "dispatchMode": booking.dispatchSetting.dispatchMode,
                                "providerName": booking.storeName,
                                "providerId": booking.storeId,
                                "serviceType": booking.serviceType,
                                "dispatchedByServerAt": moment().unix(),
                                "expiryTimestamp": moment().unix() + booking.dispatchSetting.driverAcceptTime,
                                "status": 1,
                                "statusMsg": "order sent to driver",
                                "driverName": item.firstName + ' ' + item.lastName,
                                "driverId": item._id
                            }

                            dispatchLogs.insert(log, function (err, result) {
                            });

                            webSocket.publish('dispatchLog', log, { qos: 2 }, function (mqttErr, mqttRes) {
                            });

                            var dispatchCount = 1;
                            if (booking.dispatchCount) {
                                dispatchCount = booking.dispatchCount + 1;
                            }

                            bookingsUnassigned.UpdatePush({ "orderId": parseFloat(bId) }, { $push: { "dispatched": data }, $set: { inDispatch: true, dispatchCount: dispatchCount } }, function (err, result1) {
                                // bookingsUnassigned.UpdatePush({ "orderId": bId }, { "driversLog": data }, function (err, result1) {
                                if (err) {
                                    logger.error("booking_route Not Pushed : " + err);
                                } else {
                                    logger.info("Booking Sent TO : 3" + item.firstName);
                                    sendRealTimeDataToProvider(booking, item, 60, 20, distance);
                                }
                            });
                        }
                    }
                }
            });
        } else {
            logger.info("master not found");
        }
    });
}




let SlotTimings = (slotId) => {
    return new Promise((resolve, reject) => {
        zonesDeliverySlots.getSlots(slotId, (err, dataResponse1) => {
            if (err) {
                logger.error("Error while getting delivery slots data .... ");
                reject({ code: 500 });
            } else {
                zoneDeliveryData = dataResponse1;
                resolve(true);

            }
        });
    })
}
/**
 * Send Booking Data to driver via MQTT and FCM
 * @param {*} adata Booking Data
 * @param {*} pdata Driver Data
 */
function sendRealTimeDataToProvider(adata, pdata, a, b, distance) {
    var bookingData = {};
    var pickUpAddress = "";

    if (adata.storeType == 7) {
        pickUpAddress = adata.pickup.addressLine1 ? adata.pickup.addressLine1 : "";
    } else {
        pickUpAddress = adata.storeAddress ? adata.storeAddress : "";
    }

    let deliveryFees = 0;
    if (adata.storeFreeDelivery) {
        deliveryFees = adata.storeDeliveryFee;
    } else {
        deliveryFees = adata.deliveryCharge;
    }
    bookingData = {
        'action': 11,
        'orderDatetime': adata.orderDatetime ? adata.orderDatetime : "",
        'orderDateTimeStamp': adata.bookingDateTimeStamp ? adata.bookingDateTimeStamp : 0,
        'dueDatetimeTimeStamp': adata.dueDatetimeTimeStamp ? adata.dueDatetimeTimeStamp : 0,
        'storeType': adata.storeType ? adata.storeType : "",
        'storeTypeMsg': adata.storeTypeMsg ? adata.storeTypeMsg : "",
        'amount': adata.totalAmount ? adata.totalAmount : "",
        'orderId': adata.orderId ? adata.orderId : "",
        'storeName': adata.storeName ? adata.storeName : "",
        'pickUpAddress': pickUpAddress,
        'deliveryAddress': (adata.drop.flatNumber != "" ? adata.drop.flatNumber + "," : "") + (adata.drop.landmark != "" ? adata.drop.landmark + "," : "") + (adata.drop.addressLine1 != "" ? adata.drop.addressLine1 + "," : "") + (adata.drop.addressLine2 != "" ? adata.drop.addressLine2 + "," : "") + (adata.drop.city != "" ? adata.drop.city + "," : "") + (adata.drop.state != "" ? adata.drop.state : "") + (adata.drop.postalCode != "" ? "-" + adata.drop.postalCode : ""),
        'customerName': adata.customerDetails.name,
        'customerEmail': adata.customerDetails.email,
        'customerMobile': adata.customerDetails.mobile,
        'serverTime': moment().unix(),
        'chn': pdata.listner,
        'ExpiryTimer': String(adata.dispatchSetting.driverAcceptTime),  //'30',
        'distance': Number(distance) ? Number(parseFloat(distance).toFixed(2)) : 0,
        'paymentType': adata.paymentType,
        'payByWallet': adata.payByWallet,
        'storeType': adata.storeType,
        'deliveryFee': deliveryFees,
        // 'deliveryFee': adata.deliveryCharge ? adata.deliveryCharge : 0,
        'deliveryDatetime': adata.dueDatetime ? adata.dueDatetime : "",
        'estimatedTime': 0,
        "currency": adata.currency ? adata.currency : "USD",
        "currencySymbol": adata.currencySymbol ? adata.currencySymbol : "$",
        "mileageMetric": adata.mileageMetric ? adata.mileageMetric : "km",
        "bookingType": adata.bookingType ? adata.bookingType : "",
        "isCominigFromStore": adata.isCominigFromStore,
        "storeType": adata.storeType ? adata.storeType : "",
        "expressDelivery": (typeof adata.deliveryChargeSplit != "undefined") ? (adata.deliveryChargeSplit.expressDeliveryCharge > 0) ? true : false : false,
        "slotStartTime": zoneDeliveryData.startDateTimestamp ? zoneDeliveryData.startDateTimestamp : 0,
        "slotEndTime": zoneDeliveryData.endDateTimestamp ? zoneDeliveryData.endDateTimestamp : 0,
    }
    if (adata.storeType == 5) {

        if (adata.bookingType == 1) {
            bookingData.deliveryFee = adata.deliveryChargeSplit.deliveryPriceFromCustomerToLaundromat ? adata.deliveryChargeSplit.deliveryPriceFromCustomerToLaundromat : 0;
            bookingData.expressDelivery = (typeof adata.deliveryChargeSplit != "undefined") ? (adata.deliveryChargeSplit.expressDeliveryCharge > 0) ? true : false : false;
        }
        else {
            bookingData.deliveryFee = adata.deliveryChargeSplit.deliveryPriceFromLaundromatToCustomer ? adata.deliveryChargeSplit.deliveryPriceFromLaundromatToCustomer : 0;
            bookingData.expressDelivery = (adata.deliveryChargeSplit.expressDeliveryCharge > 0) ? true : false;
        }
    }

    //send fcm notification to driver 
    notifications.notifyFcmTopic({
        action: 11,
        usertype: 1,
        deviceType: pdata.mobileDevices.deviceType,
        notification: "",
        //status.status(2, ""),
        msg: i18n.__(i18n.__('bookingStatusMsg')['sendBooking'], bookingData.orderId),
        fcmTopic: pdata.pushToken || '',
        title: i18n.__(i18n.__('bookingStatusTitle')['1']),
        data: { 'bookingData': bookingData }
    }, () => { });

    bookingData.PingId = 1;
    // bookingData.deliveryFee = bookingData.deliveryCharge;

    notifyi.notifyRealTime({ 'listner': pdata.listner, message: { 'bookingData': bookingData } });
    // notifyi.notifyRealTime({ 'listner': pdata.listner, message: bookingData });
    return;
}
