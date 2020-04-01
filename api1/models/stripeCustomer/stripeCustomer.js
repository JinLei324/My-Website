'use strict'

const tablename = 'stripeCustomer';

const db = require('../../library/mongodb')
const logger = require('winston');

const ObjectID = require('mongodb').ObjectID;

/**
 * get customer for stripe
 * @param {*} userId 
 * @param {*} mode test/live
 */
const getCustomer = (userId, mode) => {
    return new Promise((resolve, reject) => {
        db.get().collection(tablename)
            .findOne({ 'user': new ObjectID(userId), 'mode': mode }, (function (err, result) {
                err ? reject(err) : resolve(result);
            }));
    });
};

/**
 * create customer for stripe
 * @param {*} insObj 
 */
const createCustomer = (insObj) => {
    return new Promise((resolve, reject) => {
        db.get().collection(tablename)
            .insert(insObj, (function (err, result) {
                err ? reject(err) : resolve(result);
            }));
    });
};

/**
 * update customer data
 * @param {*} userId
 * @param {*} updateObj 
 * @param {*} mode test/live
 */
const updateCustomer = (userId, mode, updateObj) => {
    return new Promise((resolve, reject) => {
        let condition = { 'user': new ObjectID(userId), 'mode': mode };
        db.get().collection(tablename)
            .update(condition, updateObj, (err, result) => {
                err ? reject(err) : resolve(result);
            });
    });
};

module.exports = {
    getCustomer,
    createCustomer,
    updateCustomer
};
