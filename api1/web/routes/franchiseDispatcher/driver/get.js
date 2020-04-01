'use strict'
const config = process.env;

const Joi = require('joi');
const Async = require('async');
const logger = require('winston');
const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;
const orders = require('../../../../models/orders');
const franchise = require('../../../../models/franchise');
const stores = require('../../../../models/stores');
const drivers = require('../../../../models/driver');

const validator = {
    cityId: Joi.string().required().description('cityId'),
    index: Joi.number().integer().required().description('pageIndex'),
    franchiseId: Joi.string().required().description('franchiseId'),
    storeId: Joi.string().required().description('storeId'),
    status: Joi.number().integer().required().description('status  10 - On the Way, 11 - Arrived, 12 - Journey Started'),
    search: Joi.string().required().description('serach')
}


/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (req, reply) => {
    const driverName = (firstName, lsstName) => {
        let fname = (typeof firstName == 'undefined' || firstName == null) ? "" : firstName;
        let lname = (typeof lastName == 'undefined' || lastName == null) ? "" : lastName;
        return fname + " " + lname;
    }

    let pageIndex = req.params.index;
    let skip = pageIndex * 20;
    let limit = 20;

    let serviceZone = [];
    let storeData = {};
    const driverDataResponse = (condition, cb) => {
        var driver = [];
        drivers.readAll(condition, { skip: skip, limit: limit }, (err, res) => {
            if (res && res.length > 0) {
                res.forEach(item => {
                    driver.push({
                        '_id': item._id,
                        'latitude': item.location ? item.location.latitude : 0.0,
                        'longitude': item.location ? item.location.longitude : 0.0,
                        'image': item.profilePic,
                        'status': item.status,
                        'email': item.email,
                        'lastActive': item.lastActive,
                        'lastOnline': moment().unix() - item.lastActive,
                        'serverTime': moment().unix(),
                        'name': driverName(item.firstName, item.lastName),
                        'phone': item.countryCode + item.mobile || "",
                        'deviceType': item.mobileDevices ? item.mobileDevices.deviceType : '',
                        'batteryPercentage': parseFloat(item.batteryPer).toFixed(0) || 0,
                        'appversion': item.mobileDevices ? item.mobileDevices.appVersion : "1.0",
                        'bookingCount': item.currentBookings ? item.currentBookings.length : 0,
                        'time': item.lastActive ? moment.unix(item.lastActive).fromNow() : ""
                    });
                });
                cb(null, driver)
            } else {
                cb(null, driver)
            }
        });
    }
    const driverCount = (condition, cb) => {
        drivers.count(condition, (err, res) => {
            cb(null, res);
        })
    }
    const responseData = (status, cb) => {
        let condition = { status: status };
        switch (req.auth.credentials.userType) {
            case 0:
                condition = { status: status, "cityId": req.auth.credentials.cityId };
                if (req.params.storeId != "" && req.params.storeId != "0") {
                    if (storeData.driverType == 1) {//freelancer
                        condition = { "serviceZones": { "$in": serviceZone }, "driverType": 1, status: status };
                    } else {//store
                        condition =
                            {
                                "$or": [
                                    { "storeId": new ObjectID(req.params.storeId), "driverType": 2, status: status },
                                    { "serviceZones": { "$in": serviceZone }, "driverType": 1, status: status }
                                ]

                            };
                    }
                }
                driverDataResponse(condition, (e, r) => {
                    if (r.length != 0) {
                        driverCount(condition, (e, c) => {
                            cb(null, { count: c, data: r });
                        })
                    } else {
                        cb(null, { count: 0, data: r });
                    }
                });
                break;
            case 2:
                if (storeData.driverType == 1) {//freelancer
                    condition = { "serviceZones": { "$in": serviceZone }, "driverType": 1, status: status };
                } else {//store
                    condition = { "storeId": new ObjectID(req.auth.credentials.storeId), "driverType": 2, status: status };
                }
                driverDataResponse(condition, (e, r) => {
                    if (r.length != 0) {
                        driverCount(condition, (e, c) => {
                            cb(null, { count: c, data: r });
                        })
                    } else {
                        cb(null, { count: 0, data: r });
                    }
                });
                break;
            case 1:
                let onlinePro = [];
                let count = 0;
                Async.forEach(storeData, (item, callbackloop) => {
                    let queryCon = {};
                    if (item.driverType == 1) {//freelancer
                        queryCon = { "serviceZones": { "$in": item.serviceZones }, "driverType": 1, status: status };
                    } else {//store
                        queryCon = { "storeId": new ObjectID(item._id), "driverType": 2, status: status };
                    }
                    driverDataResponse(queryCon, (e, r) => {
                        if (r.length != 0) {
                            onlinePro = onlinePro.concat(r);
                            driverCount(queryCon, (e, c) => {
                                count = count + c;
                                callbackloop(null);
                            })
                        } else {
                            callbackloop(null);
                        }
                    });
                }, (loopErr) => {
                    cb(null, { count: count, data: onlinePro });
                });
                break;
            default:
        }
    }
    Async.series([
        function (cb) {//get new booking
            switch (req.auth.credentials.userType) {

                case 0://city
                    if (req.params.storeId != "" && req.params.storeId != "0") {
                        stores.getOne({ _id: new ObjectID(req.params.storeId) }, (err, ress) => {
                            storeData = ress;
                            serviceZone = ress.serviceZones || [];
                            cb(null);
                        });
                    } else {
                        storeData = {};
                        cb(null);
                    }

                    break;
                case 1://franchies
                    if (req.params.storeId != "" && req.params.storeId != "0") {
                        stores.readAll({ _id: new ObjectID(req.params.storeId) }, (err, ress) => {
                            storeData = ress;
                            cb(null);
                        });
                    } else {
                        stores.readAll({ franchiseId: req.auth.credentials.franchiseId }, (err, res) => {
                            storeData = res;
                            cb(null);
                        });
                    }

                    break;
                case 2://store
                    stores.getOne({ _id: new ObjectID(req.auth.credentials.storeId) }, (err, ress) => {
                        storeData = ress;
                        serviceZone = ress.serviceZones || [];
                        cb(null);
                    });
                    break;
                default:
                    break;
            }
        },
        function (cb) {//online
            let status = 3;
            responseData(status, (err, res) => {
                cb(err, res);
            })

        },

        function (cb) {//offline
            let status = 4;
            responseData(status, (err, res) => {
                cb(err, res);
            })
        },
        function (cb) {//busy
            let status = 5;
            responseData(status, (err, res) => {
                cb(err, res);
            })
        },
        function (cb) {//logout
            let status = 8;
            responseData(status, (err, res) => {
                cb(err, res);
            })
        },
        function (cb) {//inactive
            let status = 9;
            responseData(status, (err, res) => {
                cb(err, res);
            })
        },

    ], (err, result) => {
        if (err) return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);
        return reply({
            message: req.i18n.__('ordersList')['200'],
            data: {
                availableDriver: result[1].data || [],
                offlineDriver: result[2].data || [],
                busyDrivers: result[3].data || [],
                logoutDrivers: result[4].data || [],
                inactiveDriver: result[5].data || [],
                onlineCount: result[1].count,
                offlineCount: result[2].count,
                busyCount: result[3].count,
                logoutCount: result[4].count,
                inactiveCount: result[5].count,
            }
        }).code(200);
    });


}


const responseCode = {

}//swagger response code

module.exports = {
    handler,
    validator,
    responseCode
}