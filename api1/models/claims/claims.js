'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'claims'
const ObjectID = require('mongodb').ObjectID;

/** 
* @function
* @name insert a new claim 
* @param {object} params - 
*/
const postClaim = (claimData, callback) => {
    db.get().collection(tableName)
        .insert(
            {
                userId: claimData.userId,
                promoId: claimData.promoId,
                bookingId: claimData.bookingId,
                lockedTimeStamp: claimData.lockedTimeStamp,
                unlockedTimeStamp: claimData.unlockedTimeStamp,
                claimTimeStamp: claimData.created,
                discountType: claimData.discountType,
                discountValue: claimData.discountValue,
                maxDiscount: claimData.maxDiscount,
                status: claimData.status
            },
            (err, result) => { return callback(err, result); });
}

const postReferralClaim = (claimData, callBack) => {
    db.get().collection(tableName)
        .insert(claimData,

            (err, result) => { return callBack(err, result); });
}

const addClaim = (offersData, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate({
            userId: offersData.userId,
            cartId: offersData.cartId
        }, {
                $set: {
                    userId: offersData.userId,
                    promoId: offersData.promoId,
                    cartId: offersData.cartId,
                    couponCode: offersData.couponCode,
                    currency: offersData.currency,
                    currencySymbol: offersData.currencySymbol,
                    cartValue: offersData.cartValue,
                    discountValue: offersData.discountValue,
                    deliveryFee: offersData.deliveryFee,
                    lockedTimeStamp: offersData.lockedTimeStamp,
                    applicableOn: offersData.applicableOn,
                    unlockedTimeStamp: offersData.unlockedTimeStamp,
                    claimTimeStamp: offersData.claimTimeStamp,
                    discount: offersData.discount,
                    status: offersData.status
                },
                $push: {
                    "bookings": {
                        bookingId: offersData.bookingId,
                        timeStamp: moment().unix()
                    }
                }
            }, {
                upsert: true,
                returnOriginal: false
            },
            (err, result) => {
                return callback(err, result);
            });
}

const updateClaim = (claimData, callBack) => {
    db.get().collection(tableName).update({
        "userId": claimData.userId
    }, {
            $push: {
                "users": {
                    "userId": userData.userId,
                    "bookings": userData.bookings,
                    "unlockDate": userData.unlockDate,
                    "claimCount": 0

                }
            }
        },
        (err, result) => {
            return callback(err, result);
        });
}

const updateStatus = (claimData, callBack) => {
    db.get().collection(tableName).update({
        "_id": new ObjectID(claimData.claimId)
    }, {
            $set: {
                "status": claimData.status
            }
        },
        (err, result) => {
            return callBack(err, result);
        });
}

const updateUnlockedStatus = (claimData, callBack) => {
    db.get().collection(tableName).update({
        "_id": new ObjectID(claimData.claimId)
    }, {
            $set: {
                "status": claimData.status,
                "unlockedTimeStamp": claimData.unlockedTimeStamp
            }
        },
        (err, result) => {
            return callBack(err, result);
        });
}

const getClaimByClaimId = (claimId, callBack) => {
    db.get().collection(tableName)
        .find({
            "_id": new ObjectID(claimId),
        }).toArray((err, result) => {
            return callBack(err, result);
        });
}
const getUnlockedCount = (promoId, callBack) => {
    db.get().collection("promoUsers")
        .count({
            "unlockedPromoCodes.promoId": promoId
        },
            (err, result) => {
                return callBack(err, result);
            });


}

// Get climed details by promo id

const getUnlockedData = (campaignId, callBack) => {
    db.get().collection(tableName)
        .find({
            "promoId": campaignId,
            "status": "claimed"

        }).toArray((err, result) => {
            return callBack(err, result);
        });


}
// Add coupon code data
const addCouponData = (data, callBack) => {
    db.get().collection(tableName)
        .insert({
            userId: data.userId,
            promoId: data.promoId,
            bookingId: data.bookingId,
            lockedTimeStamp: data.lockedTimeStamp,
            unlockedTimeStamp: data.unlockedTimeStamp,
            claimTimeStamp: data.claimTimeStamp,
            bookingAmount: data.bookingAmount,
            discountAmount: data.discountAmount
        },
            (err, result) => {
                return callback(err, result);
            });


}

// Update claim and booking id
const updateBookingAndClaim = (claimData, callBack) => {
    db.get().collection(tableName).update({
        "_id": new ObjectID(claimData.claimId),
        "bookings.bookingId": claimData.bookingId
    }, {
            $set: {
                "status": claimData.status,
                "claimTimeStamp": claimData.claimTimeStamp
            }
        },
        (err, result) => {
            return callBack(err, result);
        });
}


// Get the claims data by user id and promo id
const checkLockedPromo = (claimData, callBack) => {
    db.get().collection(tableName)
        .find({
            "promoId": claimData.promoId,
            "userId": claimData.userId
        }).sort({
            "lockedTimeStamp": -1
        }).toArray((err, result) => {
            return callBack(err, result);
        });
}

// lock and claim count for a particular promo for user
const lockedAndClaimedCount = (claimData, callBack) => {
    db.get().collection(tableName)
        .count({
            "promoId": claimData.promoId,
            "userId": claimData.userId,
            "status": {
                $in: ["Locked", "claimed"]
            }
        },
            (err, result) => {                
                return callBack(err, result);
            });
}


// lock and claim count for a particular promo for user
const globalLockedAndClaimedCount = (claimData, callBack) => {
    db.get().collection(tableName)
        .count({
            "promoId": claimData.promoId,
            "status": {
                $in: ["Locked", "claimed"]
            }
        },
            (err, result) => {
                return callBack(err, result);
            });
}


const addClaimData = (offersData, callback) => {
    db.get().collection(tableName)
        .insert(offersData,
            (err, result) => {
                return callback(err, result);
            });
}

// Check if the user has the latest promo code locked
const allClaims = (params, callback) => {
    db.get().collection(tableName).find({})
        .toArray((err, result) => {
            return callback(err, result);
        });
}



/*Get claim id */

const getClaimIdByUserIdAndCartId = (param, callBack) => {

    db.get().collection(tableName).find(param)
        .toArray((err, result) => {
            return callBack(err, result);
        });
}


const allUnlockedCampaignByCampaignId = (params, callback) => {

    db.get().collection(tableName).find({
        'promoId': params.campaignId,
        'status': 'unLocked'
    }).skip(params.offset).limit(params.limit)
        .toArray((err, result) => {
            return callback(err, result);
        });
}

const getTotalUnlockedCountByCampiagnId = (campaignId, callback) => {

    db.get().collection(tableName).count({ 'campaignId': campaignId, 'status': 'unLocked' },
        (err, result) => {
            return callback(err, result);
        });
}


const allClaimedCampaignByCampaignId = (params, callback) => {

    db.get().collection(tableName).find({
        'promoId': params.campaignId

    }).skip(params.offset).limit(params.limit).sort({ "_id": -1 })
        .toArray((err, result) => {
            return callback(err, result);
        });
}

const getTotalClaimedCountByCampiagnId = (campaignId, callback) => {

    db.get().collection(tableName).count({ 'promoId': campaignId, 'status': 'claimed' },
        (err, result) => {
            return callback(err, result);
        });
}


module.exports = {
    addClaim,
    updateStatus,
    updateUnlockedStatus,
    updateClaim,
    getClaimByClaimId,
    getUnlockedCount,
    getUnlockedData,
    addCouponData,
    updateBookingAndClaim,
    checkLockedPromo,
    lockedAndClaimedCount,
    addClaimData,
    allClaims,
    getClaimIdByUserIdAndCartId,
    allUnlockedCampaignByCampaignId,
    getTotalUnlockedCountByCampiagnId,
    allClaimedCampaignByCampaignId,
    getTotalClaimedCountByCampiagnId,
    globalLockedAndClaimedCount,
    postClaim,
    postReferralClaim
}
