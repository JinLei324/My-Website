'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'referralCampaigns'
const ObjectID = require('mongodb').ObjectID;

/** 
 * @function
 * @name post a new campaign to promoCampaigns collection
 * @param {object} params - data coming from controller
 */
const postReferralCampaign = (refferalData, callback) => {
    db.get().collection(tableName)
        .insert(
            refferalData
            ,
            (err, result) => {
                return callback(err, result);
            });
}

const validateReferral = (requestData, callback) => {
    var citiIds = requestData.cityId;
    var zoneIds = requestData.cityId;
    // var vechileType = requestData.vehicleType;
    db.get().collection(tableName).aggregate([{
        $match: {
            "cities.cityId": {
                $in: [citiIds]
            },
            // "zones":{
            //         $in: [citiIds]
            // },
            "status": 2,
            "promoType": "referralCampaign",
        }
    }, {
        $project: {
            "_id": 1,
            "title": 1,
            "promoType": 1,
            "status": 1,
            "cities": 1,
            "zones": 1,
            "description": 1,
            "termsConditions": 1,
            "rewardTriggerType": 1,
            "startTime": 1,
            "endTime": 1,
            "referrerDiscount": 1,
            "newUserDiscount": 1,
            "perUserLimit": 1,
            "rewardTriggerType": 1,
            "tripCount": 1,
            "codesGenerated": 1,
            "newUserBillingAmtTrigger": 1,
            "howITWorks": 1,
            "referrerMLM": 1,
            "mlmStatus": 1
        }
    }
    ]).toArray(
        (err, result) => {
            return callback(err, result);
        });
}
const updateReferralsStatus = (params, callback) => {
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





    db.get().collection(tableName).find(condition).skip(requestData.offset).limit(requestData.limit)
        .toArray((err, result) => {
            return callback(err, result);
        });
}


// Update codes count
const increaseCodeGeneratedCount = (promoId, callback) => {
    db.get().collection(tableName).update({
        "_id": new ObjectID(promoId),
    }, {
            $inc: {
                "codesGenerated": 1
            }
        },


        (err, result) => {
            return callback(err, result);
        });
}

/*
Increase claim count data
 */
const increaseClaimCount = (promoId, callBack) => {
    db.get().collection(tableName).update({
        "_id": new ObjectID(promoId),
    }, {
            $inc: {
                "totalClaims": 1
            }
        },


        (err, result) => {
            return callBack(err, result);
        });
}

const getCountByStatus = (status, callBack) => {
    db.get().collection(tableName).count({ 'status': status },
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


/*
Increase qualifiedTripLogs
 */
const increaseQualifiedTripCount = (promoId, callBack) => {
    db.get().collection(tableName).update({
        "_id": new ObjectID(promoId),
    }, {
            $inc: {
                "qualifyingTrips": 1
            }
        },


        (err, result) => {
            return callBack(err, result);
        });
}



/*
Increase qualifiedTripLogs
 */
const increaseUnlockedCodeCount = (promoId, callBack) => {
    db.get().collection(tableName).update({
        "_id": new ObjectID(promoId),
    }, {
            $inc: {
                "unlockedCount": 1
            }
        },


        (err, result) => {
            return callBack(err, result);
        });
}

const updateReferral = (params, callBack) => {
    db.get().collection(tableName).updateOne({
        "_id": new ObjectID(params.referalId),
    }, {
            $set: {
                "title": params.title,


                "cities": params.cities,
                "zones": params.zones || '',
                "description": params.description,
                "rewardTriggerType": params.rewardType,
                "rewardTriggerTypeString": params.rewardTriggerTypeString,
                "startTime": params.startTime,
                "endTime": params.endTime,
                "referrerDiscount": params.referrerDiscount,
                "newUserDiscount": params.newUserDiscount,
                "perUserLimit": params.perUserLimit,
                "rewardTriggerType": params.rewardTriggerType,
                "tripCount": params.tripCount,
                "newUserBillingAmtTrigger": params.newUserBillingAmtTrigger,
                "termsConditions": params.termsConditions,
                "howITWorks": params.howITWorks
            }
        },


        (err, result) => {
            return callBack(err, result);
        });
}

module.exports = {
    postReferralCampaign,
    validateReferral,
    updateReferralsStatus,
    getAllCampaignsByStatus,
    increaseCodeGeneratedCount,
    getCountByStatus,
    getCampaignById,
    increaseClaimCount,
    increaseQualifiedTripCount,
    increaseUnlockedCodeCount,
    updateReferral
}