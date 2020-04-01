'use strict'

const logger = require('winston');
const db = require('../../library/mongodb')
let tableName = 'vouchers';//collection name

 
/** 
* @function
* @name checkVoucher 
* @param {object} params - data coming from controller
*/
const checkVoucher = (params, callback) => {
    db.get().collection(tableName)
        .findOne(params, {"vouchersList.$" : 1}, (err, result) => {
            return callback(err, result);
        });
}
/** 
* @function
* @name read 
* @param {object} params - data coming from controller
*/
const read = (params, callback) => {
    db.get().collection(tableName).find(params).sort({ '_id': 1 }).toArray((err, result) => { // normal select method
        return callback(err, result);
    });
}
/** 
* @function
* @name saveData 
* @param {object} params - data coming from controller
*/
const create = (params, callback) => {
    db.get().collection(tableName)
        .insert(
            [params],
            (err, result) => { return callback(err, result); });
}
const redeemCode = (queryObj, cb) => {
    db.get().collection(tableName)
        .findOneAndUpdate(queryObj.query, queryObj.data, queryObj.options || {}, (err, result) => {
            return cb(err, result);
        });
};
module.exports = { read, create, checkVoucher , redeemCode};
