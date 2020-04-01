'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'promoCodes'
const ObjectID = require('mongodb').ObjectID;

/** 
 * @function
 * @name insert a new offer 
 * @param {object} params - data coming from controller
 */
const postPromoCodes = (offersData, callback) => {
    db.get().collection(tableName)
        .insert({
                title :offersData.title,
                code :offersData.code,
                adminLiability :offersData.adminLiability,
                storeLiability :offersData.storeLiability,
                promoType :offersData.promoType,
                status :offersData.status,
                cities :offersData.cities,
                zones :offersData.zones,
                rewardType :offersData.rewardType,
                paymentMethod :offersData.paymentMethod,
                discount :offersData.discount,
                startTime :offersData.startTime,
                endTime :offersData.endTime,
                globalUsageLimit :offersData.globalUsageLimit,
                perUserLimit :offersData.perUserLimit,
                globalClaimCount :offersData.globalClaimCount,
                vehicleType :offersData.vehicleType,
                created :offersData.created,
                termsAndConditions :offersData.termsAndConditions
            },
            (err, result) => {
                return callback(err, result);
            });
}
const postReferralPromoCode = (referralData, callback) => {
    db.get().collection(tableName)
        .insert(referralData,
            (err, result) => {
                return callback(err, result);
            });
}


// Check if the user has the latest promo code locked

module.exports = {
    postPromoCodes,
    postReferralPromoCode  
}