'use strict'

const tablename = 'bookingAnalytics';
const db = require('../../library/mongodb')
const logger = require('winston');
const moment = require('moment');//date-time
const ObjectID = require('mongodb').ObjectID;//to convert stringId to mongodb's objectId

const post = (data, callback) => {
    db.get().collection(tablename)
        .insert(data, ((err, result) => {
            return callback(err, result);
        }));

} 

const read = (data, callback) => {
    db.get().collection(tablename)
        .findOne(data, ((err, result) => {
            return callback(err, result);
        }));

}
const getByUserId = (userId, callback) => {
    db.get().collection(tablename)
        .findOne({ userId: userId }, ((err, result) => {
            return callback(err, result);
        }));

}
const findUpdate = (obj, callback) => {
    db.get().collection(tablename)
        .findOneAndUpdate(
            obj.query,
            obj.data,
            ((err, result) => {
                return callback(err, result);
            }));
}

module.exports = {
    post,
    read, 
    getByUserId, 
    findUpdate, 
};

