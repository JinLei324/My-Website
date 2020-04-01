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
const postCouponCode = (offersData, callback) => {
    db.get().collection(tableName)
        .insert(offersData,
            (err, result) => {
                return callback(err, result);
            });
}
const validateCoupon = (requestData, callback) => {
    var citiIds = requestData.cityId;
    var zoneIds = requestData.cityId;
    var paymentMethod = requestData.paymentMethod;
    // var vechileType = requestData.vehicleType;
    db.get().collection(tableName).aggregate([{
        $match: {
            "cities": {
                $in: [citiIds]
            },
            // "zones":{
            //         $in: [citiIds]
            // },
            // "paymentMethod": paymentMethod,
            "status": 2,
            "promoType": "couponCode",
            // "vehicleType": vechileType
            "code": requestData.couponCode
        }
    }, {
        $project: {
            ab: {
                $lt: ["$globalClaimCount", "$globalUsageLimit"],

            },
            _id: 1,
            title: 1,
            code: 1,
            adminLiability: 1,
            storeLiability: 1,
            promoType: 1,
            status: 1,
            cities: 1,
            zones: 1,
            rewardType: 1,
            paymentMethod: 1,
            discount: 1,
            startTime: 1,
            endTime: 1,
            globalUsageLimit: 1,
            perUserLimit: 1,
            globalClaimCount: 1,
            vehicleType: 1,
            created: 1,
            users: 1,
        }
    }, {
        $match: {
            ab: {
                $eq: true
            }
        }
    }
    ]).toArray(
        (err, result) => {
            return callback(err, result);
        });
}

const getAllCouponCodeByStatus = (status, callback) => {
    db.get().collection(tableName).find({
        'status': status,
        'promoType': 'couponCode'
    })
        .toArray((err, result) => {
            return callback(err, result);
        });
}

const updateStatus = (params, callback) => {
    db.get().collection(tableName).findOneAndUpdate({
        "_id": {
            '$in': params.couponId
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


module.exports = {
    postCouponCode,
    validateCoupon,
    getAllCouponCodeByStatus,
    updateStatus

}