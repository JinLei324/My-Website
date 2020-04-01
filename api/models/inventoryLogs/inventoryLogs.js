'use strict'

const logger = require('winston');

let db = require('../../library/mongodb')


let tablename = 'inventoryLogs';


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
* @name read 
* @param {object} params - data coming from controller
*/
const read = (params, callback) => {
    db.get().collection(tablename).find(params).sort({ 'timeStamp': -1 }).limit(1).toArray((err, result) => { // normal select method
        return callback(err, result);
    });

}
const getOne = (params, callback) => {
    db.get().collection(tablename).find(params).sort({ '_id': -1 }).limit(1).toArray((err, result) => { // normal select method
        return callback(err, result[0]);
    });
};
module.exports = { Insert, read, getOne };
