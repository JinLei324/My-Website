'use strict'

const db = require('../../library/mongodb');
const logger = require('winston');
const ObjectID = require('mongodb').ObjectID;

const moment = require('moment');
const tablename = 'users';

// userType 0- central 1- franchies 2 -store



function Select(data, callback) {
    db.get().collection(tablename)
        .find(data)
        .toArray((err, result) => {
            return callback(err, result);
        });

}
function matchList(data, callback) {
    db.get().collection(tablename)
        .aggregate(data, (err, result) => {
            return callback(err, result);
        });
}

function SelectOne(data, callback) {
    db.get().collection(tablename)
        .findOne(data, (err, result) => {
            return callback(err, result);
        });
}


function SelectById(condition, requiredFeild, callback) {
    condition["_id"] = ObjectID(condition._id);
    db.get().collection(tablename)
        .findOne(condition, requiredFeild, ((err, result) => {
            return callback(err, result);
        }));
}


function Insert(data, callback) {
    db.get().collection(tablename)
        .insert(data, (err, result) => {
            return callback(err, result);
        });
}


function Update(condition, data, callback) {
    db.get().collection(tablename)
        .update(condition, { $set: data }, (err, result) => {
            return callback(err, result);
        });
}


function UpdateById(_id, data, callback) {
    db.get().collection(tablename)
        .update({ _id: ObjectID(_id) }, { $set: data }, (err, result) => {
            return callback(err, result);
        });
}

function UpdateByIdWithAddToSet(condition, data, callback) {
    condition["_id"] = ObjectID(condition._id);
    db.get().collection(tablename)
        .update(condition, { $addToSet: data }, (err, result) => {
            return callback(err, result);
        });
}

function UpdateByIdWithPush(condition, data, callback) {
    condition["_id"] = ObjectID(condition._id);
    db.get().collection(tablename)
        .update(condition, { $push: data }, (err, result) => {
            return callback(err, result);
        });
}
function UpdateByIdWithPull(condition, data, callback) {
    condition["_id"] = ObjectID(condition._id);
    db.get().collection(tablename)
        .update(condition, { $pull: data }, (err, result) => {
            return callback(err, result);
        });
}

function Delete(condition, callback) {
    db.get().collection(tablename)
        .remove(condition, (err, result) => {
            return callback(err, result);
        });
}
function Aggregate(condition, callback) {
    db.get().collection(tablename)
        .aggregate(condition, (err, result) => {
            return callback(err, result);
        });
}
function updateD(data, callback) {
    db.get().collection(tablename)
        .update({ _id: data._id }, { $set: data }, { upsert: true }, (err, result) => {
            return callback(err, result);
        });
}
const updateAccessCode = (params, callback) => {
    db.get().collection(tablename)
        .findOneAndUpdate({ _id: new ObjectID(params._id) },
            {
                "$set": { "deviceId": params.deviceId, "loggin": true }
            },
            {},
            (err, result) => {
                return callback(err, result);
            });
}
const count = (condition, callback) => {
    db.get().collection(tablename)
        .count(
            condition,
            (err, result) => { return callback(err, result); });
}
/** 
 * @function
 * @name updateDeviceLog 
 * @param {object} params - data coming from controller
 */
const updateDeviceLog = (params, callback) => {
    console.log("params", JSON.stringify(params))
    db.get().collection(tablename)
        .findOneAndUpdate(
            { _id: new ObjectID(params.id) },
            {
                "$set": {
                    deviceId: params.deviceId,
                    "mobileDevices": {
                        "deviceId": params.deviceId,
                        "appVersion": params.appVersion ? params.appVersion : "",
                        "currentlyActive": true,
                        "deviceOsVersion": params.deviceOsVersion ? params.deviceOsVersion : "",
                        "deviceType": params.deviceType ? params.deviceType : 2,
                        "deviceTypeMsg": params.deviceType == 1 ? "IOS" : params.deviceType == 2 ? "Android" : "Web"
                    },
                    status: params.status,
                    fcmUserTopic: params.fcmUserTopic,
                    fcmManagerTopic: params.fcmManagerTopic,
                    fcmStoreTopic: params.fcmStoreTopic,
                    fcmTopic: params.fcmStoreTopic,
                    fcmCityTopic: params.fcmCityTopic
                }
            },
            { upsert: true },
            (err, result) => { return callback(err, result); });
}
const updateMany = (queryObj, callback) => {
    db.get().collection(tablename).updateMany(queryObj.query, queryObj.data, {
        returnOriginal: false
    }, (err, result) => {
        return callback(err, result);
    });
}
const patchlogoutStatus = (params, callback) => {
    db.get().collection(tablename)
        .findOneAndUpdate(
            { _id: params._id },
            {
                "$set": {
                    "status": 3,
                    "mobileDevices.currentlyActive": false
                }
            },
            { upsert: true },
            (err, result) => { return callback(err, result); });
}
module.exports = {
    patchlogoutStatus,
    updateMany,
    updateAccessCode,
    count,
    Select, matchList, SelectOne, Insert, Update, SelectById, UpdateById,
    Delete, UpdateByIdWithAddToSet, UpdateByIdWithPush, UpdateByIdWithPull, updateD,
    updateDeviceLog

};