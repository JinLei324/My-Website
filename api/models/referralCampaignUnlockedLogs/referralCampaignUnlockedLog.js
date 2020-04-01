'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'referralUnlockedLog'
const ObjectID = require('mongodb').ObjectID;

/** 
 * @function
 * @name post a new campaign to promoCampaigns collection
 * @param {object} params - data coming from controller
 */

const postReferralUnlockedTripData = (refferalData, callback) => {
    db.get().collection(tableName)
        .insert(
                refferalData
            ,
            (err, result) => {
                return callback(err, result);
            });
}

const getTotalUnlockedDataByCampaignId = (data, callBack) => {

    db.get().collection(tableName)
        .find({
            "campaignId": data.referralCampaignId
        }).skip(data.offset).limit(data.limit).sort({
            '_id': -1
        })
        .toArray((err, result) => {
            return callBack(err, result);
        });
}


const getTotalUnlockCountByCampaignId = (campaignId, callBack) => {

    db.get().collection(tableName)
        .count({
            "campaignId": campaignId
        },
        (err, result) => {
            return callBack(err, result);
        });
}



module.exports = {
   postReferralUnlockedTripData,
   getTotalUnlockedDataByCampaignId,
   getTotalUnlockCountByCampaignId
}