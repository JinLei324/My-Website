'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'request'
const ObjectID = require('mongodb').ObjectID;

/** 
 * @function
 * @name insert a new offer 
 * @param {object} params - data coming from controller
 */
const postRequest = (requestData, callback) => {
    db.get().collection(tableName)
        .insert({
                bookingId: requestData.bookingId,
                userId: requestData.userId,
                customerFirstName: requestData.customerFirstName,
                bookingTime: requestData.bookingTime,
                customerID: requestData.customerID,
                cityId: requestData.cityId,
                zoneId: requestData.zoneId,
                paymentMethod: requestData.paymentMethod,

            },
            (err, result) => {
                return callback(err, result);
            });
}

module.exports = {
    postRequest
}
