'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'promoCampaigns'
const ObjectID = require('mongodb').ObjectID;

/** 
 * @function
 * @name insert a new offer 
 * @param {object} params - data coming from controller
 */
const postCampaign = (offersData, callback) => {
    db.get().collection(tableName)
        .insert(offersData,
            (err, result) => {
                return callback(err, result);
            });
}

const addUserToPromotion = (userData, callback) => {
    db.get().collection(tableName).update({
        "_id": new ObjectID(userData.promoId)
    }, {
            $push: {
                "users": {
                    "userId": userData.userId,
                    "bookings": userData.bookings,
                    "unlockDate": userData.unlockDate,
                    "claimCount": 0,
                    "totalBusiness": userData.totalBusiness

                }
            }
        },
        (err, result) => {
            return callback(err, result);
        });
}

const updateBooking = (userData, callback) => {
    db.get().collection(tableName).findOneAndUpdate({
        "_id": new ObjectID(userData.promoId),
        "users.userId": userData.userId
    }, {
            $push: {
                "users.$.bookings": userData.booking

            },
            $inc: {
                "users.$.totalBusiness": userData.amount
            }
        },



        (err, result) => {
            return callback(err, result);
        });
}

const updateClaimCount = (userData, callback) => {
    db.get().collection(tableName).update({
        "_id": new ObjectID(userData.promoId),
        "users.userId": userData.userId
    }, {
            $set: {
                "users.$.claimCount": userData.claimCount,
                "globalClaimCount": userData.globalClaimCount
            }
        },


        (err, result) => {
            return callback(err, result);
        });
}
// Get all campaigns
const getAllCampaigns = (params, callback) => {
    db.get().collection(tableName).find({}).sort({
        "_id": 1
    })
        .toArray((err, result) => {
            return callback(err, result);
        });
}

const getAllCampaignsByStatus = (requestData, callback) => {

    var condition = {
        'status': requestData.status,
    }
    if (typeof (requestData.sSearch) !== "undefined" && requestData.sSearch != '') {

        var regexValue = new RegExp("^" + requestData.sSearch, "i")

        condition['$or'] = [{
            'title': regexValue
        }, {
            'code': regexValue
        }, {
            'cities.cityName': regexValue
        },];
    }

    if (typeof (requestData.cityId) !== "undefined" && requestData.cityId != '') {
        condition['cities.cityId'] = requestData.cityId;
    }


    if (typeof (requestData.dateTime) !== "undefined" && requestData.dateTime !== '') {
        var dateTime = requestData.dateTime;
        var dateTimeString = dateTime.split("-", 2);
        var startDate = dateTimeString[0];
        var endDate = dateTimeString[1];
        var startDateISO = new Date(startDate).toISOString();
        var endDateISO = new Date(endDate).toISOString();

        condition['startTime'] = {

        };

        condition['endTime'] = {

        }
    }

    db.get().collection(tableName).find(condition).skip(requestData.offset).limit(requestData.limit).sort({
        '_id': -1
    })
        .toArray((err, result) => {
            return callback(err, result);
        });
}

const updateStatus = (params, callback) => {
    db.get().collection(tableName).updateMany({

        "_id": {
            '$in': params.campaignIds
        }
    }, {
            $set: {
                "status": params.status
            }
        }, {
            returnOriginal: false
        },


        (err, result) => {
            return callback(err, result);
        });
}
const updatePromoCampaign = (params, callback) => {
    db.get().collection(tableName).updateOne({
        "_id": params.campaignId
    }, {
            $set: {
                //"status": params.status
                "title": params.title,
                "code": params.code,
                "storeLiability": params.storeLiability,
                "adminLiability": params.adminLiability,
                "status": 2,
                "promoType": "campaign",
                "cities": params.cities,
                "zones": params.zones,
                "category": params.category || [],
                "rewardTriggerType": params.rewardTriggerType,
                "totalBusinessAmountRequired": params.totalBusinessAmountRequired,
                "rewardType": params.rewardType,
                "paymentMethod": params.paymentMethod,
                "isApplicableWithWallet": params.isApplicableWithWallet,
                "discount": params.discount,
                "usage": params.usage,
                "startTime": params.startTime,
                "endTime": params.endTime,
                "globalUsageLimit": params.globalUsageLimit,
                "perUserLimit": params.perUserLimit,
                "vehicleType": 0,
                "tripCount": params.tripCount,
                "created": new Date(),
                "howITWorks": params.howITWorks,
                "description": params.description,
                "termsConditions": params.termsConditions
            }
        }, {
            returnOriginal: false
        },


        (err, result) => {
            return callback(err, result);
        });
}

const removeBooking = (bookingId, callBack) => {
    db.get().collection(tableName).update({
        'users.bookings.bookingId': bookingId
    }, {
            $pull: {
                'users.$.bookings': {
                    'bookingId': bookingId
                }
            }
        },
        (err, result) => {
            return callBack(err, result);
        });
}

const getCampaignById = (campaignId, callBack) => {
    db.get().collection(tableName).find({
        '_id': new ObjectID(campaignId)
    })
        .toArray((err, result) => {
            return callBack(err, result);
        });
}


// Increase global claim count to 1 and increase user claim count to 1
const increaseClaimCount = (userData, callback) => {
    db.get().collection(tableName).update({
        "_id": new ObjectID(userData.promoId),
        "users.userId": userData.userId
    }, {
            $inc: {
                "users.$.claimCount": 1,
                "globalClaimCount": 1,
                "unlockedCodes": 1
            }
        },


        (err, result) => {
            return callback(err, result);
        });
}

// Increase qualified trip count by 1
const increaseQualifiedTripCount = (promoId, callback) => {
    db.get().collection(tableName).update({
        "_id": new ObjectID(promoId)
    }, {
            $inc: {
                "qualifyingTrips": 1
            }
        },


        (err, result) => {
            return callback(err, result);
        });
}

/*
Increase codes generated to 1
 */
const increaseCodesGeneratedCount = (promoId, callback) => {
    db.get().collection(tableName).update({
        "_id": new ObjectID(promoId)
    }, {
            $inc: {
                "unlockedCodes": 1
            }
        },


        (err, result) => {
            return callback(err, result);
        });
}


/*
@getCountByStatus
 */

const getCountByStatus = (status, callBack) => {
    db.get().collection(tableName).count({
        'status': status
    },
        (err, result) => {
            return callBack(err, result);
        });
}

module.exports = {
    postCampaign,
    addUserToPromotion,
    updateBooking,
    updateClaimCount,
    getAllCampaigns,
    getAllCampaignsByStatus,
    updateStatus,
    updatePromoCampaign,
    removeBooking,
    getCampaignById,
    increaseClaimCount,
    getCountByStatus,
    increaseQualifiedTripCount,
    increaseCodesGeneratedCount
}