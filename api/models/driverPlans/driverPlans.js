
'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'Driver_plans'
const ObjectID = require('mongodb').ObjectID;
/** 
* @function
* @name updatePresence 
* @param {object} params - data coming from controller
*/
const updatePresence = (params, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate({ _id: new ObjectID(params._id.toString())}, {
            $set: { lastOnline: moment().unix() },
            $push: {
                logs: { t: moment().unix(), s: parseInt(params.status) }
            }
        },
        { upsert: true },
        (err, result) => { return callback(err, result); });
}
/** 
* @function
* @name getById 
* @param {object} params - data coming from controller
*/
const getById = (params, callback) => {
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
        .findOneAndUpdate({ _id:params._id }, {
            $set: { totalOnline: params.totalOnline },
            $push: {
                logs: { t: moment().unix(), s: parseInt(params.status) }
            }
        },
        { upsert: true },
        (err, result) => { return callback(err, result); });
}
module.exports = {
    updatePresence,
    getById,
    updateTotalonline
}
