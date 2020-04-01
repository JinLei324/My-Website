'use strict';
const moment = require('moment');


const db = require('../../library/mongodb');
const tableName = 'walletStore';
const ObjectID = require('mongodb').ObjectID;

/** 
* @function
* @name create 
* @param {object} params - {data:object}
*/
const create = (params, callback) => {
    db.get().collection(tableName)
        .insert([params.data], (error, result) => {
            return callback(error, result);
        });
}


/** 
* @function
* @name find 
* @param {object} params { query: object, sort: object, limit: number, skip: number}
*/
const find = (params, callback) => {
    db.get().collection(tableName)
        .find(params.query || {})
        .sort(params.sort || {})
        .limit(params.limit || 0)
        .skip(params.skip || 0)
        .toArray((error, result) => {
            return callback(error, result);
        });
}


/** 
 * @function
 * @name update 
 * @param {object} params - 
 * { query: object, set: object, push: object, pull: object, inc: object, upsert: boolean, multi: boolean}
 */
const update = (params, callback) => {
    var updateObj = {}
    if (params.set) updateObj['$set'] = params.set;
    if (params.push) updateObj['$push'] = params.push;
    if (params.pull) updateObj['$pull'] = params.pull;
    if (params.inc) updateObj['$inc'] = params.inc;

    db.get().collection(tableName)
        .update(params.query,
            updateObj,
            {
                upsert: (params.upsert) ? params.upsert : false,
                multi: (params.multi) ? params.multi : false
            },
            (error, result) => {
                return callback(error, result);
            });
}


/** export all the functions */
module.exports = {
    create,
    find,
    update
}