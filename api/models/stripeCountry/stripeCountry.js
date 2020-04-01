'use strict'

const tablename = 'stripeCountry';
const db = require('../../library/mongodb')
const ObjectID = require('mongodb').ObjectID;

const SelectOne = function (data, callback) {
    db.get().collection(tablename).findOne(data, (function (err, result) {
        return callback(err, result);
    }));
};

const SelectAll = function (data, callback) {
    db.get().collection(tablename).find(data).toArray(function (err, result) {
        return callback(err, result);
    });
}

module.exports = { SelectOne, SelectAll };
