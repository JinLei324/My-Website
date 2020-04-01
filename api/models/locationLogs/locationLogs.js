
'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'locationLogs'
const ObjectID = require('mongodb').ObjectID;
/** 
* @function
* @name pushLogs 
* @param {object} params - data coming from controller
*/
const pushLogs = (params, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate({ bid: params.bid }, {
            $push: params.logData
        },
        { upsert: true },
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
* @name updateTotalonline 
* @param {object} params - data coming from controller
*/
const updateTotalonline = (params, callback) => {

    db.get().collection(tableName)
        .findOneAndUpdate({ _id: params._id }, {
            $set: { totalOnline: params.totalOnline },
            $push: {
                logs: { t: moment().unix(), s: parseInt(params.status) }
            }
        },
        { upsert: true },
        (err, result) => { return callback(err, result); });
}
/** 
* @function
* @name pushLogsNoupsert 
* @param {object} params - data coming from controller
*/
const pushLogsNoupsert = (params, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate({ bid: params.bid }, {
            $push: params.logData
        },
        (err, result) => { return callback(err, result); });
}
/** 
* @function
* @name pushLogsupsert 
* @param {object} params - data coming from controller
*/
const pushLogsupsert = (params, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate({ bid: params.bid },
        params.logData,
        { upsert: true },
        (err, result) => { return callback(err, result); });
}
const FINDONEANDUPDATE = (params, callback) => {
    db.get().collection(tableName)
       .findOneAndUpdate(params.query,
       params.data,
       params.options,
       (err, result) => { return callback(err, result); });
}


const UpdatePushOrCreate = (condition, data, callback) => {
    db.get().collection(tablename).update(condition, data, { upsert: true }, (function (err, result) {
        return callback(err, result);
    }));
}

const UpdatePush = (condition, data, callback) => {
    db.get().collection(tablename).update(condition, { $push: data }, (function (err, result) {
        return callback(err, result);
    }));
}


const read = (data, callback) => {
    db.get().collection(tablename)
        .findOne(data, ((err, result) => {
            return callback(err, result);
        }));
}
module.exports = {
    pushLogs,
    pushLogsNoupsert,
    pushLogsupsert,
    isExistsWithId,
    updateTotalonline,
    FINDONEANDUPDATE,
    read,
    UpdatePush,
    UpdatePushOrCreate,
}
