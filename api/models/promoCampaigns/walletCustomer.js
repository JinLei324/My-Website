'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'walletCustomer'
const ObjectID = require('mongodb').ObjectID;

const getAllUserTransactionById = (userId, callback) => {

    db.get().collection(tableName).find({
            'userId': userId
        }).sort({
            "_id": -1
        })
        .toArray((err, result) => {
            return callback(err, result);
        });
}

const addWalletCustomer = (walletData, callback) => {
    db.get().collection(tableName)
        .insert({
                "txnId":walletData.txnId,
                "userId":walletData.userId,
                "txnType":walletData.txnType,
                "trigger":walletData.trigger,
                "comment":walletData.comment,
                "currency":walletData.currency,
                "openingBal":walletData.openingBal,
                "amount":walletData.amount,
                "closingBal":walletData.closingBal,
                "bonusOpeingBal":walletData.bonusOpeingBal,
                "bonusAmount":walletData.bonusAmount,
                "bonusClosingBal":walletData.bonusClosingBal,
                "paymentType":walletData.paymentType,
                "timestamp":walletData.timestamp,
                "orderId":walletData.orderId,
                "bookingType":walletData.bookingType,
                "paymentTxnId":walletData.paymentTxnId,
                "intiatedBy":walletData.intiatedBy,
                "orderSeqId":walletData.orderSeqId,
                "timeStamp": new Date()
            },
            (err, result) => {
                return callback(err, result);
            });
}

module.exports = {
    getAllUserTransactionById,
    addWalletCustomer
}