'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'inputTripLogs'
const ObjectID = require('mongodb').ObjectID;

/** 
 * @function
 * @name insert a new offer 
 * @param {object} params - data coming from controller
 */
const postInputLogs = (data, callback) => {
    db.get().collection(tableName)
        .insert(data,
            (err, result) => {
                return callback(err, result);
            });
}

const getAllTripLogs = (params, callback) => {
    db.get().collection(tableName).find({}).sort({ '_id': -1 })
        .toArray((err, result) => {
            return callback(err, result);
        });
}

module.exports = {
   postInputLogs,
   getAllTripLogs
}