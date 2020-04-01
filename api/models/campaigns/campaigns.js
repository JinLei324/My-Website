'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'campaigns'
const ObjectID = require('mongodb').ObjectID;

/** 
 * @function
 * @name saveCode 
 * @param {object} params - data coming from controller
 */
const saveCode = (params, callback) => {

    db.get().collection(tableName)
        .findOne({ code: params.code }, (err, result) => {

            return callback(err, result);
        });
}
const readAll = (callback) => {
    db.get().collection(tableName)
        .find({}).toArray((err, result) => {
            return callback(null, result);
        });
}

const read = (data, callback) => {
    db.get().collection(tableName)
        .findOne(data, ((err, result) => {
            return callback(err, result);
        }));

}
const insert = (data, callback) => {
    db.get().collection(tableName)
        .insert(data, ((err, result) => {
            return callback(err, result);
        }));

}
module.exports = {
     saveCode,
     read
}
