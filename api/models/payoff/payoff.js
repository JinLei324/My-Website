'use strict'

const db = require('../../library/mongodb');
const logger = require('winston');
const moment = require('moment');//date-time
const ObjectID = require('mongodb').ObjectID;//to convert stringId to mongodb's objectId

const readUserData = (collection, condition, projection) => {
    return new Promise((resolve, reject) => {
        db.get().collection(collection)
            .aggregate(condition, ((err, result) => {
                err ? reject(err) : resolve(result);
            }));
    });
};

const insert = (collection, insObj) => {
    return new Promise((resolve, reject) => {
        db.get().collection(collection)
            .insert(insObj, (function (err, result) {
                err ? reject(err) : resolve(result);
            }));
    });
};

const read = (collection, condition) => {
    return new Promise((resolve, reject) => {
        db.get().collection(collection)
            .findOne(condition, ((err, result) => {
                err ? reject(err) : resolve(result);
            }));
    });
}

const readAll = (collection, condition) => {
    return new Promise((resolve, reject) => {
        db.get().collection(collection)
            .find(condition).toArray((err, result) => {
                err ? reject(err) : resolve(result);
            });
    });
}

const aggregate = (collection, condition) => {
    return new Promise((resolve, reject) => {
        db.get().collection(collection)
            .aggregate(condition, ((err, result) => { // aggregate method
                err ? reject(err) : resolve(result);
            }));
    });
}

module.exports = {
    readUserData,
    insert,
    read,
    readAll,
    aggregate
};
