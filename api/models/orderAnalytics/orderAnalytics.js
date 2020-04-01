'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'orderAnalytics'
const ObjectID = require('mongodb').ObjectID;


const getByUserId = (userId, callBack) => {
    db.get().collection(tableName).find({
        'userId': userId
    })
        .toArray((err, result) => {
            return callBack(err, result);
        });
}
const insert = (data, callback) => {
    db.get().collection(tableName)
        .insert(
            data,
            (err, result) => { return callback(err, result); });
}


const update = (data, callback) => {
    db.get().collection(tableName)
        .update(data.q, data.param, (err, result) => {
            return callback(err, result);
        })
}

const get = (data, callback) => {
    db.get().collection(tableName)
        .findOne(data, (err, result) => {
            return callback(err, result);
        })
}
module.exports = {
    getByUserId,
    insert,
    update,
    get
}