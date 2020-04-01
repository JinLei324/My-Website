'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'walletStore'
const ObjectID = require('mongodb').ObjectID;

const getAllData = (walletCustomerUserUpdateResponse,callback) => {

    db.get().collection(tableName).find({}).sort({
            "_id": -1
        })
        .toArray((err, result) => {
            return callback(err, result);
        });
}

const updateStoreWallet = (updateData,callback) => {
	 db.get().collection(tableName)
        .insert({
                "txnId": updateData.transactionId,
	            "userId":updateData.userId,
	            "txnType":updateData.txnType,
	            "trigger":updateData.trigger,
	            "comment":updateData.comment,
	            "currency":updateData.currency,
	            "openingBal":updateData.openingBal,
	            "amount":updateData.amount,
	            "closingBal":updateData.closingBal,
	            "paymentType":updateData.paymentType,
	            "timestamp":updateData.timestamp,
	            "orderId":updateData.orderId,
	            "bookingType":updateData.bookingType,
	            "paymentTxnId":updateData.paymentTxnId,
	            "intiatedBy":updateData.intiatedBy,
	            "orderSeqId":updateData.orderSeqId
            },
            (err, result) => {
                return callback(err, result);
            });

}
module.exports = {
    getAllData, updateStoreWallet

}