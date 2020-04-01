'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'dailyLowestPrice'
const ObjectID = require('mongodb').ObjectID;

const getByStoreId = (params, callback) => {
    db.get().collection(tableName)
        .find(params).limit(10).toArray((err, result) => {
            return callback(err, result);
        });
}
const update = (params, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate(params.q, params.data, params.options || {}, (err, result) => {
            return callback(err, result)
        })
}
module.exports = {
    getByStoreId,
    update
}