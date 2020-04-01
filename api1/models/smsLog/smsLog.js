'use strict'

const logger = require('winston');

let db = require('../../library/mongodb')


let tablename = 'smsLog';


// db.connect(() => { });//create a connection to mongodb
/** 
* @function
* @name Insert 
* @param {object} data - data coming from controller
*/
const Insert = (data, callback) => {
    db.get().collection(tablename).insert([data], (err, result) => {
        return callback(err, result);
    });
}
/** 
* @function
* @name updateByMsgId 
* @param {object} queryObj - data coming from controller
*/
const updateByMsgId = (queryObj, callback) => {
    db.get().collection(tablename).findOneAndUpdate(queryObj.query, queryObj.data, ((err, result) => {
        return callback(err, result);
    }));
}
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
module.exports = { Insert, updateByMsgId,read };
