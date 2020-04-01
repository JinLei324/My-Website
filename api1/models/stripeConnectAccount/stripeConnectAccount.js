'use strict'

const tablename = 'stripeConnectAccount';

const db = require('../../library/mongodb')
const logger = require('winston');

const ObjectID = require('mongodb').ObjectID;

/**
 * get connect account for stripe
 * @param {*} userId 
 * @param {*} mode test/live
 */
const getAccount = (userId, mode) => {
    return new Promise((resolve, reject) => {
        db.get().collection(tablename)
            .findOne({ 'user': new ObjectID(userId), 'mode': mode }, (function (err, result) {
                err ? reject(err) : resolve(result);
            }));
    });
};

/**
 * create connect account for stripe
 * @param {*} insObj 
 */
const createAccount = (insObj) => {
    return new Promise((resolve, reject) => {
        db.get().collection(tablename)
            .insert(insObj, (function (err, result) {
                err ? reject(err) : resolve(result);
            }));
    });
};

module.exports = {
    getAccount,
    createAccount
};
