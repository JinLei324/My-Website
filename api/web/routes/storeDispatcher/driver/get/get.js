'use strict'

const ObjectID = require('mongodb').ObjectID;
const drivers = require('../../../../../models/driver');
const stores = require('../../../../../models/stores');
// const webSocket = require('../../../../library/websocket');
const webSocket = require('../../../../../library/websocket/websocket');
const error = require('../../../../../locales'); // response messages based on language 
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const Async = require('async');

/** 
 * @function
 * @name handler 
 * @return {object} Reply to the user.
 */
const handler = (request, reply) => {

    let pageIndex = request.params.index;
    let skip = pageIndex * 20;
    let limit = 20;
    let status = request.params.status;
    let search = request.params.search;
    let conditionForDriver = {};


    if (search && search.length > 0) {
        conditionForDriver.firstName = new RegExp("^" + request.params.search, "gi")
        conditionForDriver.lastName = new RegExp("^" + request.params.search, "gi")
    }



    stores.getOne({
        _id: new ObjectID(request.params.storeId)
    }, (err, storeData) => {

        let serviceZone = storeData.serviceZones || [];
        Async.series([

            function (cb) {

                if (storeData.driverType == 1) { //freelancer
                    conditionForDriver = {
                        "serviceZones": {
                            "$in": serviceZone
                        },
                        "driverType": 1,
                        status: 3
                    };
                } else { //store
                    conditionForDriver = {
                        "storeId": new ObjectID(request.params.storeId),
                        "driverType": 2,
                        status: 3
                    };
                }

                drivers.readAll(conditionForDriver, {
                    skip: skip,
                    limit: limit
                }, (err, onlineDrivers) => {
                    //  cb(null, onlineDrivers);
                    var onlinePro = [];
                    Async.forEach(onlineDrivers, function (item, callbackloop) {

                        var fname = (typeof item.firstName == 'undefined' || item.firstName == null) ? "" : item.firstName;
                        var lname = (typeof item.lastName == 'undefined' || item.lastName == null) ? "" : item.lastName;
                        var name = fname + " " + lname;
                        var obj = {
                            items: item.phone
                        };
                        // var arrayFound = obj.items.myFind({ "isCurrentlyActive": true });
                        onlinePro.push({
                            '_id': item._id.toString(),
                            'latitude': item.location.latitude,
                            'longitude': item.location.longitude,
                            'image': item.profilePic,
                            'status': item.status,
                            'email': item.email,
                            'lastActive': item.lastActive,
                            'lastOnline': moment().unix() - item.lastActive,
                            'serverTime': moment().unix(),
                            'name': name,
                            'phone': item.countryCode + item.mobile || "",
                            'deviceType': item.mobileDevices.deviceType || '',
                            'batteryPercentage': parseFloat(item.batteryPer).toFixed(0) || 0,
                            'appversion': item.mobileDevices.appVersion,
                            'bookingCount': item.currentBookings ? item.currentBookings.length : 0,
                            //'batteryPercentage': item.
                            // 'locationCheck': item.locationCheck == 0 ? 'off' : 'on',
                            // 'bookingCount': count,
                            'time': moment.unix(item.lastActive).fromNow()
                        });

                        callbackloop(null, onlinePro);

                    }, function (loopErr) {
                        cb(null, onlinePro);
                    });


                })
            },
            function (cb) {

                if (storeData.driverType == 1) { //freelancer
                    conditionForDriver = {
                        "serviceZones": {
                            "$in": serviceZone
                        },
                        "driverType": 1,
                        status: 4
                    };
                } else { //store
                    conditionForDriver = {
                        "storeId": new ObjectID(request.params.storeId),
                        "driverType": 2,
                        status: 4
                    };
                }
                drivers.readAll(conditionForDriver, {
                    skip: skip,
                    limit: limit
                }, (err, offlineDrivers) => {
                    // cb(null, offlineDrivers);
                    var offlinePro = [];
                    Async.forEach(offlineDrivers, function (item, callbackloop) {

                        var fname = (typeof item.firstName == 'undefined' || item.firstName == null) ? "" : item.firstName;
                        var lname = (typeof item.lastName == 'undefined' || item.lastName == null) ? "" : item.lastName;
                        var name = fname + " " + lname;
                        var obj = {
                            items: item.phone
                        };
                        // var arrayFound = obj.items.myFind({ "isCurrentlyActive": true });
                        offlinePro.push({
                            '_id': item._id.toString(),
                            'latitude': item.location.latitude,
                            'longitude': item.location.longitude,
                            'image': item.profilePic,
                            'status': item.status,
                            'email': item.email,
                            'lastActive': item.lastActive,
                            'lastOnline': moment().unix() - item.lastActive,
                            'serverTime': moment().unix(),
                            'name': name,
                            'phone': item.countryCode + item.mobile || "",
                            'deviceType': item.mobileDevices.deviceType || '',
                            'batteryPercentage': parseFloat(item.batteryPer).toFixed(0) || 0,
                            'appversion': item.mobileDevices.appVersion,
                            'bookingCount': item.currentBookings ? item.currentBookings.length : 0,
                            // 'locationCheck': item.locationCheck == 0 ? 'off' : 'on',
                            // 'bookingCount': count,
                            'time': moment.unix(item.lastActive).fromNow()

                        });
                        callbackloop(null, offlinePro);
                    }, function (loopErr) {
                        cb(null, offlinePro);

                    });
                })
            },
            function (cb) {

                if (storeData.driverType == 1) { //freelancer
                    conditionForDriver = {
                        "serviceZones": {
                            "$in": serviceZone
                        },
                        "driverType": 1,
                        status: 5
                    };
                } else { //store
                    conditionForDriver = {
                        "storeId": new ObjectID(request.params.storeId),
                        "driverType": 2,
                        status: 5
                    };
                }
                drivers.readAll(conditionForDriver, {
                    skip: skip,
                    limit: limit
                }, (err, busyDrivers) => {
                    // cb(null, busyDrivers);
                    var busyPro = [];
                    Async.forEach(busyDrivers, function (item, callbackloop) {

                        var fname = (typeof item.firstName == 'undefined' || item.firstName == null) ? "" : item.firstName;
                        var lname = (typeof item.lastName == 'undefined' || item.lastName == null) ? "" : item.lastName;
                        var name = fname + " " + lname;
                        var obj = {
                            items: item.phone
                        };
                        // var arrayFound = obj.items.myFind({ "isCurrentlyActive": true });
                        busyPro.push({
                            '_id': item._id.toString(),
                            'latitude': item.location.latitude,
                            'longitude': item.location.longitude,
                            'image': item.profilePic,
                            'status': item.status,
                            'email': item.email,
                            'lastActive': item.lastActive,
                            'lastOnline': moment().unix() - item.lastActive,
                            'serverTime': moment().unix(),
                            'name': name,
                            'phone': item.countryCode + item.mobile || "",
                            'deviceType': item.mobileDevices.deviceType || '',
                            'batteryPercentage': parseFloat(item.batteryPer).toFixed(0) || 0,
                            'appversion': item.mobileDevices.appVersion,
                            'bookingCount': item.currentBookings ? item.currentBookings.length : 0,
                            // 'locationCheck': item.locationCheck == 0 ? 'off' : 'on',
                            // 'bookingCount': count,
                            'time': moment.unix(item.lastActive).fromNow()

                        });
                        callbackloop(null, busyPro);
                    }, function (loopErr) {
                        cb(null, busyPro);

                    });
                })
            },
            function (cb) {

                if (storeData.driverType == 1) { //freelancer
                    conditionForDriver = {
                        "serviceZones": {
                            "$in": serviceZone
                        },
                        "driverType": 1,
                        status: 8
                    };
                } else { //store
                    conditionForDriver = {
                        "storeId": new ObjectID(request.params.storeId),
                        "driverType": 2,
                        status: 8
                    };
                }
                drivers.readAll(conditionForDriver, {
                    skip: skip,
                    limit: limit
                }, (err, logoutDrivers) => {
                    // cb(null, logoutDrivers);
                    var logoutPro = [];
                    Async.forEach(logoutDrivers, function (item, callbackloop) {

                        var fname = (typeof item.firstName == 'undefined' || item.firstName == null) ? "" : item.firstName;
                        var lname = (typeof item.lastName == 'undefined' || item.lastName == null) ? "" : item.lastName;
                        var name = fname + " " + lname;
                        var obj = {
                            items: item.phone
                        };
                        // var arrayFound = obj.items.myFind({ "isCurrentlyActive": true });
                        logoutPro.push({
                            '_id': item._id.toString(),
                            'latitude': item.location.latitude,
                            'longitude': item.location.longitude,
                            'image': item.profilePic,
                            'status': item.status,
                            'email': item.email,
                            'lastActive': item.lastActive,
                            'lastOnline': moment().unix() - item.lastActive,
                            'serverTime': moment().unix(),
                            'name': name,
                            'phone': item.countryCode + item.mobile || "",
                            'deviceType': item.mobileDevices ? item.mobileDevices.deviceType : "" || '',
                            'batteryPercentage': parseFloat(item.batteryPer).toFixed(0) || 0,
                            'appversion': item.mobileDevices ? item.mobileDevices.appVersion : "",
                            'bookingCount': item.currentBookings ? item.currentBookings.length : 0,
                            // 'locationCheck': item.locationCheck == 0 ? 'off' : 'on',
                            // 'bookingCount': count,
                            'time': moment.unix(item.lastActive).fromNow()

                        });
                        callbackloop(null, logoutPro);
                    }, function (loopErr) {
                        cb(null, logoutPro);

                    });
                })
            }, //loggedIn:false,
            function (cb) {

                if (storeData.driverType == 1) { //freelancer
                    conditionForDriver = {
                        "serviceZones": {
                            "$in": serviceZone
                        },
                        "driverType": 1,
                        status: 3
                    };
                } else { //store
                    conditionForDriver = {
                        "storeId": new ObjectID(request.params.storeId),
                        "driverType": 2,
                        status: 3
                    };
                }
                drivers.count(conditionForDriver, (err, onlineCount) => {
                    cb(null, onlineCount);
                })
            },
            function (cb) {

                if (storeData.driverType == 1) { //freelancer
                    conditionForDriver = {
                        "serviceZones": {
                            "$in": serviceZone
                        },
                        "driverType": 1,
                        status: 4
                    };
                } else { //store
                    conditionForDriver = {
                        "storeId": new ObjectID(request.params.storeId),
                        "driverType": 2,
                        status: 4
                    };
                }
                drivers.count(conditionForDriver, (err, offlineCount) => {
                    cb(null, offlineCount);
                })
            },
            function (cb) {

                if (storeData.driverType == 1) { //freelancer
                    conditionForDriver = {
                        "serviceZones": {
                            "$in": serviceZone
                        },
                        "driverType": 1,
                        status: 5
                    };
                } else { //store
                    conditionForDriver = {
                        "storeId": new ObjectID(request.params.storeId),
                        "driverType": 2,
                        status: 5
                    };
                }
                drivers.count(conditionForDriver, (err, busyCount) => {
                    cb(null, busyCount);
                })
            },
            function (cb) {

                if (storeData.driverType == 1) { //freelancer
                    conditionForDriver = {
                        "serviceZones": {
                            "$in": serviceZone
                        },
                        "driverType": 1,
                        status: 8
                    };
                } else { //store
                    conditionForDriver = {
                        "storeId": new ObjectID(request.params.storeId),
                        "driverType": 2,
                        status: 8
                    };
                }
                drivers.count(conditionForDriver, (err, logoutCount) => {
                    cb(null, logoutCount);
                })
            },
            function (cb) {

                if (storeData.driverType == 1) { //freelancer
                    conditionForDriver = {
                        "serviceZones": {
                            "$in": serviceZone
                        },
                        "driverType": 1,
                        status: 9
                    };
                } else { //store
                    conditionForDriver = {
                        "storeId": new ObjectID(request.params.storeId),
                        "driverType": 2,
                        status: 9
                    };
                }
                drivers.count(conditionForDriver, (err, inactiveCount) => {
                    cb(null, inactiveCount);
                })
            },
            function (cb) {

                if (storeData.driverType == 1) { //freelancer
                    conditionForDriver = {
                        "serviceZones": {
                            "$in": serviceZone
                        },
                        "driverType": 1,
                        status: 9
                    };
                } else { //store
                    conditionForDriver = {
                        "storeId": new ObjectID(request.params.storeId),
                        "driverType": 2,
                        status: 9
                    };
                }
                drivers.readAll(conditionForDriver, {
                    skip: skip,
                    limit: limit
                }, (err, inactiveDrivers) => {
                    // cb(null, logoutDrivers);
                    var inactivePro = [];
                    Async.forEach(inactiveDrivers, function (item, callbackloop) {

                        var fname = (typeof item.firstName == 'undefined' || item.firstName == null) ? "" : item.firstName;
                        var lname = (typeof item.lastName == 'undefined' || item.lastName == null) ? "" : item.lastName;
                        var name = fname + " " + lname;
                        var obj = {
                            items: item.phone
                        };
                        // var arrayFound = obj.items.myFind({ "isCurrentlyActive": true });
                        inactivePro.push({
                            '_id': item._id.toString(),
                            'latitude': item.location.latitude,
                            'longitude': item.location.longitude,
                            'image': item.profilePic,
                            'status': item.status,
                            'email': item.email,
                            'lastActive': item.lastActive,
                            'lastOnline': moment().unix() - item.lastActive,
                            'serverTime': moment().unix(),
                            'name': name,
                            'phone': item.countryCode + item.mobile || "",
                            'deviceType': item.mobileDevices.deviceType || '',
                            'batteryPercentage': parseFloat(item.batteryPer).toFixed(0) || 0,
                            'appversion': item.mobileDevices.appVersion,
                            'bookingCount': item.currentBookings ? item.currentBookings.length : 0,
                            // 'locationCheck': item.locationCheck == 0 ? 'off' : 'on',
                            // 'bookingCount': count,
                            'time': moment.unix(item.lastActive).fromNow()

                        });
                        callbackloop(null, inactivePro);
                    }, function (loopErr) {
                        cb(null, inactivePro);

                    });
                })
            }

        ], (err, result) => {
            if (err) return reply({
                message: request.i18n.__('genericErrMsg')['500']
            }).code(500);


            webSocket.publish('storeDrivers/' + request.params.storeId, {
                data: {
                    availableDriver: result[0],
                    offlineDriver: result[1],
                    busyDrivers: result[2],
                    logoutDrivers: result[3],
                    onlineCount: result[4],
                    offlineCount: result[5],
                    busyCount: result[6],
                    logoutCount: result[7],
                    inactiveCount: result[8],
                    inactiveDriver: result[9]
                }
            }, {
                    qos: 2
                }, (mqttErr, mqttRes) => { });

            return reply({
                message: request.i18n.__('driverList')['200'],
                data: {
                    availableDriver: result[0],
                    offlineDriver: result[1],
                    busyDrivers: result[2],
                    logoutDrivers: result[3],
                    onlineCount: result[4],
                    offlineCount: result[5],
                    busyCount: result[6],
                    logoutCount: result[7],
                    inactiveCount: result[8],
                    inactiveDriver: result[9]
                }
            }).code(200);
        })
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
    index: Joi.number().integer().required().description('index')
}


/**
 * A module that exports customer get cart handler, get cart validator! 
 * @exports handler 
 */
module.exports = {
    handler,
    validator
}