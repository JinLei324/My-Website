'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'dispatchLogs'
const ObjectID = require('mongodb').ObjectID;



/** 
 * @function
 * @name getData 
 * @param {object} params - data coming from controller
 */
const getAll = (params, callback) => {
    db.get().collection(tableName)
        .find({}).skip(params.skip).limit(params.limit).toArray((err, result) => {
            return callback(err, result);
        });
}


const insert = (data, callback) => {
    db.get().collection(tableName)
        .insert(data, ((err, result) => {
            return callback(err, result);
        }));
}


const update = (cond, data) => {
    // db.get().collection(tableName).update(cond,data, (err, result) => {
    //     return callback(err, result);
    // })
    return new Promise((resolve, reject) => {
        db.get().collection(tableName)
            .findOneAndUpdate(cond, data,
            ((err, result) => {
                err ? reject(err) : resolve(result);
            }));
    });
}

const count = (params,callback) => {
    db.get().collection(tableName)
        .count(params,(err, result) => {
             return callback(err, result); 
        });
}

module.exports = {
    getAll,
    update,
    insert,
    count
};

