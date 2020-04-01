
'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'driverPresenceDaily'
const ObjectID = require('mongodb').ObjectID;

let timestamp = moment().unix();
/** 
* @function
* @name updatePresence 
* @param {object} params - data coming from controller
*/
const updatePresence = (params, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate({ mid: params._id, date: moment().format('DD-MMM-YY'), timestamp: moment().startOf('day').unix() },
        {
            $set: { lastOnline: moment().unix() },
            $push: { logs: { t: moment().unix(), s: params.status, d: 0 } }
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
            mid: params.mid, date: moment().format('DD-MMM-YY')
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
        .findOneAndUpdate({ mid: params.mid, date: moment().format('DD-MMM-YY'), timestamp: moment().startOf('day').unix() },
        {
            $set: { totalOnline: params.totalOnline },
            $push: {
                logs: { t: moment().unix(), s: parseInt(params.status), d: moment().unix() - params.lastOnline },
                shifts: { s: params.lastOnline, e: moment().unix(), d: moment().unix() - params.lastOnline }
            }
        },
        { upsert: true },
        (err, result) => { return callback(err, result); });
}
/** 
* @function
* @name isExists 
* @param {object} params - data coming from controller
*/
const isExists = (params, callback) => {
    db.get().collection(tableName)
    .find(params)
    .toArray((err, result) => { // normal select method
        return callback(err, result);
    });
}
module.exports = {
    updatePresence,
    isExistsWithId,
    updateTotalonline,
    isExists
}
