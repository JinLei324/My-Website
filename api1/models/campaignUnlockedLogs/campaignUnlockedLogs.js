'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'campaignUnlockedTripLogs'
const ObjectID = require('mongodb').ObjectID;


/*
@function to add a trip on which a campaign gets unlocked
*/

const postData = (reqeustData, callback) => {
    db.get().collection(tableName)
        .insert(reqeustData,
            (err, result) => {
                return callback(err, result);
            });
}

const getUnlockedDataByPromoId = (params, callback) => {
      db.get().collection(tableName).find({
            'promoId': params.campaignId,
        }).skip(params.offset).limit(params.limit).sort({"_id": -1})
        .toArray((err, result) => {
            return callback(err, result);
        });
}
const getTotalUnlockedCountByCampiagnId = (campaignId, callback) => {
    
    db.get().collection(tableName).count({'campaignId' : campaignId},
        (err, result) => {
            return callback(err, result);
        });
}


module.exports = {
    postData,
    getUnlockedDataByPromoId,
    getTotalUnlockedCountByCampiagnId
}