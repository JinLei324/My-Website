'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'zonesDeliverySlots'
const ObjectID = require('mongodb').ObjectID;
const logger = require('winston');

/** 
* @function
* @name get 
* @param {object} params - data coming from controller
*/
const get = (params, callback) => {
    db.get().collection(tableName)
        .aggregate(params).toArray((err, result) => {
            return callback(err, result);
        });
}

const getSlots = (params, callback) => {
    db.get().collection(tableName)
        .findOne({ _id: new ObjectID(params) },
            ((err, result) => {
                return callback(err, result);
            }));
}

const update = (cond, data, callback) => {

    db.get().collection(tableName)
        .update(cond, data,
            ((err, result) => {
                return callback(err, result);
            }));

}

module.exports = {
    get,
    getSlots,
    update
}
