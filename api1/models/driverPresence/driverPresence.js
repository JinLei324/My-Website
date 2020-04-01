
'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'driverPresence'
const ObjectID = require('mongodb').ObjectID;

let timestamp = moment().unix();
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
    updatePresence,
    isExistsWithId,
    updateTotalonline
}
