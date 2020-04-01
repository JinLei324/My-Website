
'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const client = require('../../library/redis');
const moment = require('moment')
const tableName = 'driver'
const ObjectID = require('mongodb').ObjectID;
const Timestamp = require('mongodb').Timestamp;
const appConfig = require('../appConfig');
const logger = require('winston');
/** 
* @function
* @name getNearby 
* @param {object} params - data coming from controller
*/
const getNearby = (params, callback) => {
    var geoNearCond = [
        {
            $geoNear:
            {
                'near':
                {
                    'longitude': params.long,
                    'latitude': params.lat
                },
                'distanceField': "distance",
                'distanceMultiplier': 6378.137,
                'spherical': true,
                'query': { "status": 3 }
            }
        },
        { "$sort": { "distance": 1 } },
        { "$limit": 1 }
    ];
    db.get().collection(tableName)
        .aggregate(geoNearCond, (function (err, result) {
            return callback(err, result);
        }));

}
/** 
 * @function
 * @name updateCustomersLatLong 
 * @param {object} params - data coming from controller
 */
const updateCustomersLatLong = (params, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate(
            { 'mobileDevices.deviceId': params.deviceId },
            {
                "$set": {
                    status: 2, //   0 - Active , 1 - Banned , 2 - Unverfied 
                    createdDate: moment().unix(),
                    coordinates: { longitude: parseFloat(params.longitude || 0.0), latitude: parseFloat(params.latitude || 0.0) },
                }
            }, { upsert: true }, (err, result) => {
                return callback(err, result);
            });
}
/** 
 * @function
 * @name updateCustomersDeviceLog 
 * @param {object} params - data coming from controller
 */
const updateCustomersDeviceLog = (params, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate({ _id: new ObjectID(params.id) },
            {
                "$set": {
                    userType: params.userType,
                    mobileDevices: {
                        deviceId: params.deviceId,
                        deviceType: parseInt(params.deviceType),
                        pushToken: params.pushToken ? params.pushToken : "",
                        lastLogin: moment().unix(),
                        currentlyActive: true
                    }
                }
            }, { upsert: true },
            (err, result) => {
                return callback(err, result);
            });
}
/** 
 * @function
 * @name addWalletId 
 * @param {object} params - data coming from controller
 */

const addWalletId = (params, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate(
            { _id: new ObjectID(params.userId) },
            {
                "$set": {
                    walletId: new ObjectID(params.walletId)
                }
            },
            (err, result) => {
                return callback(err, result);
            });
}
/** 
* @function
* @name updateAccessCode 
* @param {object} params - data coming from controller
*/
const updateAccessCode = (params, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate({ _id: new ObjectID(params._id) },
            {
                "$set": { "mobileDevices.deviceId": params.deviceId }
            },
            {},
            (err, result) => {
                return callback(err, result);
            });
}
/** 
 * @function
 * @name count 
 * @param {object} condition - data coming from controller
 */
const count = (condition, callback) => {
    db.get().collection(tableName)
        .count(
            condition,
            (err, result) => { return callback(err, result); });
}
/** 
 * @function
 * @name makeVerifyTrue 
 * @param {object} params - data coming from controller
 */
const makeVerifyTrue = (params, callback) => {

    db.get().collection(tableName)
        .findOneAndUpdate({ countryCode: params.countryCode, phone: params.mobile },
            {
                $set: { mobileVerified: true }
            },
            { multi: true },
            (err, result) => { return callback(err, result); });
}

/** 
* @function
* @name isExists 
* @param {object} params - data coming from controller
*/
const isExists = (params, callback) => {
    db.get().collection(tableName)
        .findOne({
            $or: [
                { email: params.email },
                { countryCode: params.countryCode, mobile: params.mobile }
            ]
        },
            (err, result) => {
                return callback(err, result);
            });
}

/** 
* @function
* @name isExistsOrCondition 
* @param {object} params - data coming from controller
*/
const isExistsOrCondition = (params, callback) => {
    db.get().collection(tableName)
        .findOne({
            $or: params
        }, (err, result) => {
            return callback(err, result);
        });
}
/** 
* @function
* @name saveReferralCode 
* @param {object} params - data coming from controller
*/
const saveReferralCode = (params, callback) => {
    db.get().collection(tableName)
        .insert(
            [params],
            (err, result) => { return callback(err, result); });
}

/** 
 * @function
 * @name updateDeviceStatusLog 
 * @param {object} params - data coming from controller
 */
const updateDeviceStatusLog = (params, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate(
            { _id: new ObjectID(params.id) },
            {
                "$set": {
                    status: 3,
                    statusMsg: 'online',
                    previousState: 3,
                    timedOut: false,
                    appVersion: params.appVersion,
                    listner: params.mqttKey,
                    publishChn: params.mqttKey,
                    pushToken: params.pushToken,
                    // vehicleTypeName: params.vehicleData.length > 0 ? params.vehicleData[0].vehicleType : "",
                    // vehiclePlatNo: params.vehicleData.length > 0 ? params.vehicleData[0].platNo : "",
                    // vehicleModel: params.vehicleData.length > 0 ? params.vehicleData[0].vehicleModel : "",
                    "mobileDevices.appVersion": params.appVersion,
                    "mobileDevices.deviceOsVersion": params.deviceOsVersion,
                    "mobileDevices.deviceId": params.deviceId,
                    "mobileDevices.deviceType": parseInt(params.deviceType),
                    "mobileDevices.pushToken": params.pushToken ? params.pushToken : "",
                    "mobileDevices.lastLogin": moment().unix(),
                    "mobileDevices.lastTimestamp": new Timestamp(1, moment().unix()),
                    "mobileDevices.lastISOdate": new Date(),
                    "mobileDevices.currentlyActive": true

                }
            },
            { upsert: true },
            (err, result) => { return callback(err, result); });
}
/** 
 * @function
 * @name setPassword 
 * @param {object} params - data coming from controller
 */
const setPassword = (params, callback) => {

    db.get().collection(tableName)
        .findOneAndUpdate({ _id: params._id },
            { $set: { password: params.password } }, {},
            (err, result) => { return callback(err, result); });
}
/** 
 * @function
 * @name patchPopupStatus 
 * @param {object} params - data coming from controller
 */
const patchPopupStatus = (params, callback) => {

    db.get().collection(tableName)
        .update({ _id: params._id },
            { $set: { isPopupShowing: false } }, {},
            (err, result) => { return callback(err, result); });
}
/** 
 * @function
 * @name patchApptStatus 
 * @param {object} params - data coming from controller
 */
const patchApptStatus = (params, callback) => {

    db.get().collection(tableName)
        .update({ _id: params._id },
            { $set: { apptStatus: params.apptStatus } }, {},
            (err, result) => { return callback(err, result); });
}
/** 
 * @function
 * @name patchProfile 
 * @param {object} params - data coming from controller
 */
const patchProfile = (params, callback) => {

    db.get().collection(tableName)
        .findOneAndUpdate({ _id: params._id },
            { $set: params },
            (err, result) => { return callback(err, result); });
}
/** 
* @function
* @name patchProfile 
* @param {object} params - data coming from controller
*/
const patchVehicles = (params, callback) => {

    db.get().collection(tableName)
        .findOneAndUpdate({ _id: params._id },
            { $set: params },
            (err, result) => { return callback(err, result); });
}
/** 
* @function
* @name isExistsWithId 
* @param {object} params - data coming from controller
*/
const isExistsWithId = (params, callback) => {
    db.get().collection(tableName)
        .findOne({
            _id: params._id
        }, (err, result) => {
            return callback(err, result);
        });
}
/** 
 * @function
 * @name patchlogoutStatus 
 * @param {object} params - data coming from controller
 */
const patchlogoutStatus = (params, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate(
            { _id: params._id },
            {
                "$set": {
                    "status": 8,
                    "statusMsg": "logout",
                    'vehicleId': "",
                    "timedOut": false,
                    "previousState": 4,
                    "type": "",
                    "specialities": [],
                    'mobileDevices.lastLogin': moment().unix(),
                    "mobileDevices.lastTimestamp": new Timestamp(1, moment().unix()),
                    "mobileDevices.lastISOdate": new Date(),
                    'mobileDevices.currentlyActive': false,
                    // 'publishChn': "",
                    // 'listner': "",
                    // "pushToken":"",
                    // "mobileDevices.pushToken": ""
                }
            },
            { upsert: true },
            (err, result) => { return callback(err, result); });
}
/** 
 * @function
 * @name checkWithEmailOrMail 
 * @param {object} params - data coming from controller
 */
const checkWithEmailOrMail = (params, callback) => {
    db.get().collection(tableName)
        .findOne(params, (err, result) => {
            return callback(err, result);
        });
}
/** 
* @function
* @name changePassword 
* @param {object} params - data coming from controller
*/
const changePassword = (params, callback) => {

    db.get().collection(tableName)
        .findOneAndUpdate({ countryCode: params.countryCode, mobile: params.mobile, status: { $nin: [1, 6, 7] } },
            {
                $set: { password: params.password }
            },
            { multi: true },
            (err, result) => { return callback(err, result); });
}

/** 
 * @function
 * @name patchOnlineStatus 
 * @param {object} params - data coming from controller
 */
const patchOnlineStatus = (params, callback) => {
    let cond = {};
    cond = (params.status == 3) ? {
        status: params.status,
        statusMsg: "online",
        previousState: params.status,
        timedOut: false,
        "mobileDevices.currentlyActive": true
    } : {
            status: params.status,
            statusMsg: "offline",
            previousState: params.status,
            timedOut: false,
            "mobileDevices.lastTimestamp": new Timestamp(1, moment().unix()),
            "mobileDevices.lastISOdate": new Date(),
            "mobileDevices.currentlyActive": false
        };
    db.get().collection(tableName)
        .findOneAndUpdate({ _id: params._id },
            {
                $set: cond
            },
            (err, result) => {
                return callback(err, result);
            });
}
/** 
 * @function
 * @name makeOnline 
 * @param {object} params - data coming from controller
 */
const makeOnline = (params, callback) => {
    db.get().collection(tableName)
        .update(
            { _id: params._id },
            {
                "$set": {
                    status: 3, //  3- online 4- offline
                    statusMSg: 'online',
                    timedOut: true
                }
            },
            (err, result) => {
                return callback(err, result);
            });
}
/** 
* @function
* @name isExistsWithTimeout 
* @param {object} params - data coming from controller
*/
const isExistsWithTimeout = (params, callback) => {
    db.get().collection(tableName)
        .findOne({
            _id: params._id, timedOut: true
        }, (err, result) => {
            return callback(err, result);
        });
}
/** 
 * @function
 * @name makeTimeoutFalse 
 * @param {object} params - data coming from controller
 */
const makeTimeoutFalse = (params, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate(
            { _id: params._id },
            {
                "$set": {
                    timedOut: false
                }
            },
            (err, result) => {
                return callback(err, result);
            });
}

/** 
 * @function
 * @name updateAllLogs 
 * @param {object} params - data coming from controller
 */
const updateAllLogs = (params, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate(
            { _id: params._id },
            {
                "$set": params.newdata
            },
            (err, result) => {
                return callback(err, result);
            });
}


/** 
 * @function
 * @name did_exists 
 * @param {object} params - data coming from controller
 */
const did_exists = (params, callback) => {
    client.client.exists("did_" + params._id, function (err, data) {
        return callback(err, data);
    });
}

/** 
 * @function
 * @name presence_exists 
 * @param {object} params - data coming from controller
 */
const presence_exists = (params, callback) => {
    client.client.exists("presence_" + params._id, function (err, data) {
        return callback(err, data);
    });
}
/** 
 * @function
 * @name did_get 
 * @param {object} params - data coming from controller
 */
const did_get = (params, callback) => {
    client.client.get("did_" + params._id, function (err, bid) {
        return callback(err, bid);
    });
}

/** 
 * @function
 * @name getAllD 
 * @param {object} params - data coming from controller
 */
const getAllD = (params, callback) => {
    db.get().collection(tableName).find()
        .toArray((err, result) => { // normal select method
            return callback(err, result);
        });
}
/** 
* @function
* @name getDriverPlansById 
* @param {object} params - data coming from controller
*/
const getDriverPlansById = (params, callback) => {
    let cond = [
        { $match: { _id: params._id } },
        {
            $lookup: {

                "from": "Driver_plans",
                "localField": "planID",
                "foreignField": "_id",
                "as": "DriverPlan"

            }
        }]
    db.get().collection(tableName)
        .aggregate(cond, (function (err, result) {
            return callback(err, result);
        }));
}
/** 
 * @function
 * @name patchBookings 
 * @param {object} params - data coming from controller
 */
const patchBookings = (params, callback) => {
    db.get().collection(tableName)
        .update(
            { _id: params._id },
            {
                $inc: { currentBookingsCount: 1 },
                $set: { onJob: true },
                $push: { currentBookings: { bid: params.bid, time: moment().unix() } }
            },
            (err, result) => { return callback(err, result); });
}
/** 
 * @function
 * @name pullCurrentBooking 
 * @param {object} params - data coming from controller
 */
const pullCurrentBooking = (params, callback) => {
    db.get().collection(tableName)
        .update(
            { _id: params._id },
            {
                $inc: { currentBookingsCount: -1 },
                $pull: { currentBookings: { bid: params.bid } }
            },
            (err, result) => { return callback(err, result); });
}
/** 
 * @function
 * @name setExPresence 
 * @param {object} params - data coming from controller
 */
const setExPresence = (params, callback) => {
    client.client.setex(params.key, params.presenceTime, params.extra, function (err, result) { });
}
/** 
 * @function
 * @name deleteFromPresence 
 * @param {object} params - data coming from controller
 */
const deleteFromPresence = (params, callback) => {
    client.client.del(params.key, function (err, data) {
        return callback(err, data);
    });
}
/** 
 * @function
 * @name makeInActive 
 * @param {object} params - data coming from controller
 */
const makeInActive = (params, callback) => {

    db.get().collection(tableName)
        .update({ _id: new ObjectID(params.id), status: { $nin: [1, 6, 7] } },
            {
                $set: {
                    status: params.status,
                    statusMsg: "inactive",
                    "mobileDevices.currentlyActive": false,
                    "mobileDevices.lastTimestamp": new Timestamp(1, moment().unix()),
                    "mobileDevices.lastISOdate": new Date()
                }
            },
            (err, result) => { return callback(err, result); });
}
/** 
 * @function
 * @name isExistsWithCond 
 * @param {object} params - data coming from controller
 */
const isExistsWithCond = (params, callback) => {
    db.get().collection(tableName)
        .findOne(params, { status: 1, cityId: 1, wallet: 1, email: 1, firstName: 1 }, (err, result) => {
            return callback(err, result);
        });
}

/** 
* @function
* @name patchRating 
* @param {object} params - data coming from controller
*/
const patchRating = (params, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate({ _id: params._id },
            {
                $set: {
                    averageRating: parseFloat(params.finalAverageValue),
                },
                $push: { reviewLogs: params.reviewLog },
                $inc: { averageRatingCount: 1 }
            },
            (err, result) => { return callback(err, result); });
}
// /** 
//  * @function
//  * @name getData 
//  * @param {object} params - data coming from controller
//  */
// const getAll = (params, callback) => {
//     db.get().collection(tableName)
//         .find({}).skip(params.skip).limit(params.limit).toArray((err, result) => {
//             return callback(err, result);
//         });
// }
/** 
 * @function
 * @name getAll 
 * @param {object} params - data coming from controller
 */



const getAll = (params, callback) => {
    db.get().collection(tableName)
        .find({ status: params.status, storeId: new ObjectID(params.storeId), driverType: params.driverType }).skip(params.skip).limit(params.limit).toArray((err, result) => {
            return callback(err, result);
        });
}
const readAll = (condition, params, callback) => {
    db.get().collection(tableName)
        .find(condition).skip(params.skip).limit(params.limit).toArray((err, result) => {
            return callback(err, result);
        });
}

const getAlls = (params, callback) => {
    db.get().collection(tableName)
        .find({ status: params.status, storeId: new ObjectID(params.storeId) }).toArray((err, result) => {
            return callback(err, result);
        });
}

const readAllByLimit = (params, callback) => {
    db.get().collection(tableName)
        .find(params.q).skip(params.skip).limit(params.limit).toArray((err, result) => {
            return callback(err, result);
        });
}


const countOne = (params, callback) => {
    db.get().collection(tableName)
        .count(params, ((err, result) => {
            return callback(err, result);
        }));
}

const getDriver = (params, callback) => {
    db.get().collection(tableName)
        .findOne(params, (err, result) => {
            return callback(err, result);
        })
}

const read = (data) => {
    return new Promise((resolve, reject) => {
        db.get().collection(tableName)
            .findOne(data, ((err, result) => {
                err ? reject(err) : resolve(result);
            }));
    });
}

const findOneAndUpdate = (userId, data, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate(
            { _id: new ObjectID(userId) },
            data,
            ((err, result) => {
                return callback(err, result);
            }));
}

const updateWithoutPromise = (cond, data, cb) => {
    db.get().collection(tableName)
        .findOneAndUpdate(cond, { $set: data },
            ((err, result) => {
                return cb(err, result);
            }));
}

const updateWithoutPromisebooking = (cond, data, cb) => {
    db.get().collection(tableName)
        .findOneAndUpdate(cond, { $push: { currentBookings: data } },
            ((err, result) => {
                return cb(err, result);
            }));
}


const fineAndUpdate = (condition, data, callback) => {
    db.get().collection(tableName).update(condition, { $set: data }, (err, result) => {
        return callback(err, result);
    });
}

const FINDONEANDUPDATE = (queryObj, cb) => {
    db.get().collection(tableName)
        .findOneAndUpdate(queryObj.query, queryObj.data, queryObj.options || {}, (err, result) => {
            return cb(err, result);
        });
};
const readReviewAndRating = (userId, start, callback) => {
    db.get().collection(tableName)
        .findOne(
            {
                _id: new ObjectID(userId),
            },
            {
                averageRating: 1, reviewCount: 1, reviews: { $slice: [start, 5] }
            },
            ((err, result) => {
                return callback(err, result);
            }));
}

const SelectOne = (data, callback) => {
    db.get().collection(tableName).findOne(data, (err, result) => {
        return callback(err, result);
    });
}


const geoNear = (condition, callback) => {
    let query = { status: { "$in": [3] }, "carId": { "$ne": 0 } };
    var geonearObj = {
        geoNear: tableName,
        near: {
            longitude: parseFloat(condition.long),
            latitude: parseFloat(condition.lat)
        },
        spherical: true,
        maxDistance: 20 / 6378.1,
        distanceMultiplier: 6378.1,
        query: query
    };
    db.get().command(geonearObj, (err, result) => {
        return callback(null, result);
    });
}

const GeoNearCond = (condition, location, distance, callback) => {
    // db.get().command({
    //     geoNear: tableName,
    //     near: {
    //         longitude: parseFloat(location.lng),
    //         latitude: parseFloat(location.lat)
    //     },
    //     spherical: true,
    //     // maxDistance: 500000 / 6378137,
    //     distanceMultiplier: 6378137,
    //     query: condition
    // }, (err, geoResult) => {
    //     return callback(err, geoResult);
    // });
    db.get().collection(tableName).aggregate([
        {
            $geoNear: {
                'near': {
                    "Longitude": parseFloat(location.lng),
                    "Latitude": parseFloat(location.lat)
                },
                'distanceField': "distance",
                "maxDistance": distance / 6378.1,
                "distanceMultiplier": 6378.1,
                //'maxDistance': 100000 / 6378137,
                // 'distanceMultiplier': 6378.137,
                'spherical': true,
                'query': condition
            }
        }, {
            "$sort": { "distance": 1 } // Sort the nearest first
        }
    ]).toArray((err, geoResult) => {
        return callback(err, geoResult);
    })
};



const AGGREGATE = (queryObj, cb) => {
    db.get().collection(tableName)
        .aggregate(queryObj, (err, result) => {
            return cb(err, result);
        });
};


const insert = (data, callback) => {
    db.get().collection(tableName)
        .insert(data, ((err, result) => {
            return callback(err, result);
        }));
}


const update = (cond, data) => {
    // db.get().collection(tableName).update(cond,data, (err, result) => {
    //     return callback(err, result);
    // })
    return new Promise((resolve, reject) => {
        db.get().collection(tableName)
            .findOneAndUpdate(cond, data,
                ((err, result) => {
                    err ? reject(err) : resolve(result);
                }));
    });
}
/** 
* @function
* @name updatePresence 
* @param {object} params - data coming from controller
*/
const updatePresence = (params, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate({ _id: params._id }, {
            $set: { lastOnline: moment().unix() },
            $push: {
                logs: { t: moment().unix(), s: parseInt(params.status), d: 0 }
            }
        },

            { upsert: true },
            (err, result) => { return callback(err, result); });


}
/** 
   * @function
   * @name updateTotalonline 
   * @param {object} params - data coming from controller
   */
const updateTotalonline = (params, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate({ _id: params._id },
            {
                $set: { _id: params._id, totalOnline: params.totalOnline },
                $push: {
                    logs: { t: moment().unix(), s: params.status, d: moment().unix() - params.lastOnline }
                }
            },
            { upsert: true },
            (err, result) => { return callback(err, result); });
}
module.exports = {
    updateTotalonline,
    updatePresence,
    updateCustomersLatLong,
    updateCustomersDeviceLog,
    addWalletId,
    makeVerifyTrue,
    isExists,
    saveReferralCode,
    updateDeviceStatusLog,
    setPassword,
    isExistsWithId,
    checkWithEmailOrMail,
    count,
    isExistsOrCondition,
    patchProfile,
    patchlogoutStatus,
    changePassword,
    patchOnlineStatus,
    makeOnline,
    isExistsWithTimeout,
    makeTimeoutFalse,
    getNearby,
    setExPresence,
    updateAllLogs,
    did_exists,
    did_get,
    getAllD,
    getDriverPlansById,
    patchBookings,
    patchPopupStatus,
    patchApptStatus,
    pullCurrentBooking,
    deleteFromPresence,
    makeInActive,
    presence_exists,
    isExistsWithCond,
    updateAccessCode,
    patchRating,
    getAll,
    update,
    insert,
    getDriver, updateWithoutPromisebooking, AGGREGATE, GeoNearCond, geoNear, SelectOne, readReviewAndRating, FINDONEANDUPDATE, fineAndUpdate, updateWithoutPromise, findOneAndUpdate, read, countOne, readAllByLimit, getAlls, readAll

}
