'use strict'

const tablename = 'stripeEventLog';

const db = require('../../library/mongodb')
const logger = require('winston');

const ObjectID = require('mongodb').ObjectID;

/**
 * insert Stripe Event Logs in DB
 * @param {*} insObj
 */
const insert = (insObj) => {
    return new Promise((resolve, reject) => {
        db.get().collection(tablename)
            .insert(insObj, (function (err, result) {
                err ? reject(err) : resolve(result);
            }));
    });
};
/** 
* @function
* @name read 
* @param {object} params - data coming from controller
*/
const read = (params, callback) => {
    db.get().collection(tablename).find({}).sort({ '_id': -1 }).toArray((err, result) => { // normal select method
        return callback(err, result);
    });

}
module.exports = {
    insert,read
};
