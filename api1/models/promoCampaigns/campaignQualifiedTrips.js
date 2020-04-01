'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'campaignQualifiedTrips'
const ObjectID = require('mongodb').ObjectID;

/** 
 * @function
 * @name insert a new offer 
 * @param {object} params - data coming from controller
 */
const allQualifiedTripLog = (data, callback) => {
    db.get().collection(tableName)
        .insert(data,
            (err, result) => {
                return callback(err, result);
            });
}

const getAllQualifiedTripLogs = (params, callback) => {
    db.get().collection(tableName).find({})
        .toArray((err, result) => {
            return callback(err, result);
        });
}

const getAllQualifiedTripsByPromoIds = (params, callback) => {
     
     db.get().collection(tableName).find({
            'campaignId': params.campaignId
        }).skip(params.offset).limit(params.limit).sort({'_id': -1})
        .toArray((err, result) => {
            return callback(err, result);
        });
}

const getCountByCampaignId = (campaignId, callback) => {
    
    db.get().collection(tableName).count({'campaignId' : campaignId},
        (err, result) => {
            return callback(err, result);
        });
}

module.exports = {
   allQualifiedTripLog,
   getAllQualifiedTripLogs,
   getAllQualifiedTripsByPromoIds,
   getCountByCampaignId
}