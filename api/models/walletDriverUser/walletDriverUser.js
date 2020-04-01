'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'walletDriverUser'
const ObjectID = require('mongodb').ObjectID;
/** 
* @function
* @name savewalletUser 
* @param {object} params - data coming from controller
*/
const savewalletUser = (params, callback) => {
    db.get().collection(tableName)
        .insert(
        [{
            userId: params.userId,
            softLimitStatus: 0,
            hardLimitStatus: 0,
            walletBalance: 0
        }],
        (err, result) => { return callback(err, result); });
}

module.exports = {
    savewalletUser,
}
