'use strict'

const tablename = 'stripeCharges';
const db = require('../../library/mongodb')
const logger = require('winston');
const moment = require('moment');//date-time
const ObjectID = require('mongodb').ObjectID;//to convert stringId to mongodb's objectId

const post = (data, callback) => {
    db.get().collection(tablename)
        .insert([data], ((err, result) => {
            return callback(err, result);
        }));
}

const read = (data, callback) => {
    db.get().collection(tablename)
        .findOne(data, ((err, result) => {
            return callback(err, result);
        }));

}
const readAll = (condition, callback) => {
    db.get().collection(tablename)
        .find(condition).sort({ _id: -1 }).toArray((err, result) => {
            return callback(err, result);
        });
}
module.exports = {
    post,
    read,
    readAll
};

