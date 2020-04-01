
'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'franchiseManagers'
const ObjectID = require('mongodb').ObjectID;
const Timestamp = require('mongodb').Timestamp;

const logger = require('winston');

const isExists = (params, callback) => {
    db.get().collection(tableName)
        .findOne({
            $or: [
                { email: params.email },
                { phone: params.phone }
            ]
        }, (err, result) => {
            return callback(err, result);
        });
}
const get = (params, callback) => {
    db.get().collection(tableName)
        .findOne({ "_id": new ObjectID(params.id) }, (err, result) => {
            return callback(err, result);
        })
}
module.exports = {
    isExists,
    get
}
