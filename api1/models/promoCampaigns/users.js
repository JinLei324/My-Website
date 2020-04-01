'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'slaves'
const ObjectID = require('mongodb').ObjectID;

/*
@function to get user details by user id
@params : userId
 */

const getUserDetails = (userId, callBack) => {
     db.get().collection(tableName)
        .find({
               "_id": new ObjectID(userId),
            }).toArray((err, result) => {
            return callBack(err, result);
        });
}

const addReferralCampaingsToUser = (data, callBack) => {
	db.get().collection(tableName).update({
            "_id": new ObjectID(data.userId)
        }, {
            $set: {
                "referralCode": data.referralCode
            }
        },
        (err, result) => {
            return callBack(err, result);
        });
}

const updateUserData = (data, callBack) => {
    db.get().collection(tableName).update({
        "_id" : new ObjectID(data.userId)
    },
    {
        $set:{
            "referralDiscountStatus": data.referralDiscountStatus,
            "campaignId": data.campaignId,
            "referralData" : data.referrerData
            // "discountData": data.discountData
        }
    })
}

const updateUserReferralDiscountStatus= (data, callBack) => {
     db.get().collection(tableName).update({
        "_id" : new ObjectID(data.userId)
    },
    {
        $set:{
            "referralDiscountStatus": data.status
            
        }
    })
}

module.exports = {
    getUserDetails,
    addReferralCampaingsToUser,
    updateUserData,
    updateUserReferralDiscountStatus
}