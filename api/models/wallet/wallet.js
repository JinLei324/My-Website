'use strict'

const tablename = 'wallet';

const db = require('../../library/mongodb');

const logger = require('winston');

const SelectWIthLimitSortSkip = function (tablename, data, sortBy, limit, skipCount, callback) {
    db.get().collection(tablename).find(data).sort(sortBy).limit(limit).skip(skipCount).toArray(function (err, result) {
        return callback(err, result);
    });
}

const Insert = function (tablename, data, callback) {
    db.get().collection(tablename).insert([data], function (err, result) {
        return callback(err, "data Inserted SucessFully");
    });
};

const FINDONEANDUPDATE = (collection, queryObj, cb) => {
    db.get().collection(collection)
        .findOneAndUpdate(queryObj.query, queryObj.data, queryObj.options || {}, (err, result) => {
            return cb(err, result);
        });
};

const UpdatePush = function (tablename, condition, data, callback) {
    db.get().collection(tablename).update(condition, { $push: data }, (function (err, result) {
        return callback(err, result);
    }));
};

const SelectOne = function (tablename, data, callback) {
    db.get().collection(tablename).findOne(data, (function (err, result) {
        return callback(err, result);
    }));
};

const Update = function (tablename, condition, data, callback) {
    db.get().collection(tablename).update(condition, { $set: data }, (function (err, result) {
        return callback(err, result);
    }));
};


const Delete = function (tablename, condition, callback) {
    db.get().collection(tablename).remove(condition, function (err, numberOfRemovedDocs) {
        return callback(err, numberOfRemovedDocs);
    });
};

const Count = function (tablename, condition, callback) {
    db.get().collection(tablename).count(condition, function (err, count) {
        return callback(err, count);
    });
};

const SELECT = (collection, queryObj, cb) => {
    db.get().collection(collection)
        .find(queryObj.q || {}, queryObj.p || {})
        .sort(queryObj.s || {})
        .skip(queryObj.skip || 0)
        .limit(queryObj.limit || 0)
        .toArray((err, docs) => {
            return cb(err, docs);
        });
};

module.exports = {
    SelectWIthLimitSortSkip,
    Insert,
    FINDONEANDUPDATE,
    UpdatePush,
    SelectOne,
    Update,
    Delete,
    Count,
    SELECT
};
