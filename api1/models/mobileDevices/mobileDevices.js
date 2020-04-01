'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'mobileDevices'
const ObjectID = require('mongodb').ObjectID;
const Timestamp = require('mongodb').Timestamp;
/** 
* @function
* @name updateMobileDevices 
* @param {object} params - data coming from controller
*/
const updateMobileDevices = (params, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate(
        { deviceId: params.deviceId },
        {
            "$set": {
                userId: new ObjectID(params.id.toString()), 
                userType: params.userType, //1 - customer ,2 - master 3 -guest 4 - storemanager               
                userTypeMsg : params.userTypeMsg,
                deviceId: params.deviceId,
                deviceType: parseInt(params.deviceType),
                appVersion: params.appVersion ? params.appVersion : "",
                deviceOsVersion: params.deviceOsVersion ? params.deviceOsVersion : "",
                deviceMake: params.deviceMake ? params.deviceMake : "",
                deviceModel: params.deviceModel ? params.deviceModel : "",
                pushToken: params.pushToken ? params.pushToken : "",
                deviceTime: new Date(params.deviceTime),               
                registerTime: moment().unix(),
                lastLogin: moment().unix(),
                "lastTimestamp": new Timestamp(1, moment().unix()),
                "lastISOdate": new Date(),
                loggedIn: true,
                coordinates: params.coordinates
            }
        },
        { upsert: true },
        (err, result) => { return callback(err, result); });
}


module.exports = {
    updateMobileDevices
}
