'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'walletCustomerUser'
const ObjectID = require('mongodb').ObjectID;

const findUser = (userId, callback) => {

    db.get().collection(tableName).find({
        'userId': userId
    })
        .toArray((err, result) => {
            return callback(err, result);
        });
}

const updateUser = (updateData, callback) => {
    db.get().collection(tableName).update({
        "userId": updateData.userId
    },
        {
            $set: {
                "userId": updateData.userId,
                "softLimitStatus": updateData.softLimitStatus,
                "hardLimitStatus": updateData.hardLimitStatus,
                "wallet_balance": updateData.wallet_balance,
                "bonusBalance": updateData.bonusBalance,
                timeStamp: new Date()
            },
            $push: {
                txn: updateData.txn
            }
        },
        { upsert: true },


        (err, result) => {
            return callback(err, result);
        });

}

module.exports = {
    findUser, updateUser
}