'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'promoUsers'
const ObjectID = require('mongodb').ObjectID;

/** 
* @function
* @name insert a new offer 
* @param {object} params - data coming from controller
*/
const getUser = (userId, callBack) => {
    db.get().collection(tableName)
        .find({
            "userId": userId,
        }).toArray((err, result) => {
            return callBack(err, result);
        });
}

/*
* @ function to insert new user
* @ 
 */

const insertNewUser = (promoData, callBack) => {
    db.get().collection(tableName)
        .insert({
            userId: promoData.userId,
            unlockedPromoCodes:
                [{
                    promoCode: promoData.promoCode,
                    promoId: promoData.promoId,
                    unlockDate: promoData.unlockDate,
                    expiryDate: promoData.expiryDate,
                    perUserClaimLimit: promoData.perUserClaimLimit,
                    claims: {
                        claimId: promoData.claimId,
                        status: promoData.status

                    }

                }]

        },
            (err, result) => {
                return callBack(err, result);
            });

}
// update user 
const updatePromo = (userData, callBack) => {
    db.get().collection(tableName).update({
        "_id": new ObjectID(userData.promoId),
        "unlockedPromoCodes.promoId": updateData.promoId

    }, {
            $push: {
                "claims": {
                    "userId": userData.userId,
                    "bookings": userData.bookings,
                    "unlockDate": userData.unlockDate,
                    "claimCount": 0

                }
            }
        },
        (err, result) => {
            return callBack(err, result);
        });
}

// Update claim
const updateClaim = (updateData, callBack) => {
    db.get().collection(tableName).update({
        "unlockedPromoCodes.promoId": updateData.promoId
    }, {
            $push: {
                "claims": {
                    claimId: updateData.claimId

                }
            }
        },
        (err, result) => {
            return callBack(err, result);
        });
}
// Update unlocked promo codes
const updateUnlockedPromoCodes = (userData, callback) => {
    db.get().collection(tableName).update({
        "userId": userData.userId
    }, {
            $push: {
                "unlockedPromoCodes": {
                    "promoCode": userData.promoCode,
                    "promoId": userData.promoId,
                    "unlockDate": userData.unlockDate,
                    "expiryDate": userData.expiryDate,
                    "perUserClaimLimit": userData.perUserClaimLimit

                }
            }


        }, {
            returnOriginal: false
        },


        (err, result) => {
            return callback(err, result);
        });
}
// check if user has unlocked the promo codes or not
const checkUserPromo = (data, callBack) => {
    db.get().collection(tableName)
        .find({
            "userId": data.userId,
            "unlockedPromoCodes.promoId": data.promoId
        }).toArray((err, result) => {
            return callBack(err, result);
        });
}

// Get promo details by id

const getPromoDetailsById = (promoId, callBack) => {
    db.get().collection(tableName)
        .find({
            "_id": new ObjectID(promoId)

        }).toArray((err, result) => {
            return callBack(err, result);
        });
}

// Get if user has the promo code or not

const checkUserPromoCode = (promoUserData, callBack) => {
    db.get().collection(tableName)
        .find({
            "userId": promoUserData.userId,
            "unlockedPromoCodes.promoCode": code

        }).toArray((err, result) => {
            return callBack(err, result);
        });
}

module.exports = {
    getUser, insertNewUser, updatePromo, updateClaim, checkUserPromo, updateUnlockedPromoCodes, checkUserPromoCode
}