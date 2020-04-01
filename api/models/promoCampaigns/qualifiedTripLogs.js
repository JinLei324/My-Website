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
const getAllCampaignQualifiedTrips = (params, callback) => {
    db.get().collection(tableName).find({})
        .toArray((err, result) => {
            return callback(err, result);
        });
}

module.exports = {
   getAllCampaignQualifiedTrips
}