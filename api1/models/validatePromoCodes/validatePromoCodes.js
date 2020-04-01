'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'promoCampaigns'
const ObjectID = require('mongodb').ObjectID;
const logger = require('winston');


/*
 * @function validate campaign
 * @check requested city, zone, timestamp, payment mothod, global claim count
 * @param {object} params - cityId, zoneId, paymentMethod, globalClaimCount
 * @returns avilabile city
 */

const validateCampaign = (requestData, callback) => {
    var zoneIds = requestData.zoneId;
    var paymentMethod = requestData.paymentMethod;
        db.get().collection(tableName).aggregate([{
            $match: {
                "cities.cityId": {
                        $in: [requestData.cityId]
                },
                // "zones":{
                //         $in: [zoneIds]
                // },
                "paymentMethod": {$in:[paymentMethod, 3]},
                "status"   : 2,
            }
        }, {
            $project: {
                // ab: {
                //     $lt: ["$globalClaimCount", "$globalUsageLimit"],
                    
                // },
                _id: 1,
                title: 1,
                code: 1,
                storeLiability: 1,
                adminLiability: 1,
                status: 1,
                promoType: 1,
                cities: 1,
                zones : 1,
                rewardTriggerType : 1,
                totalBusinessAmountRequired : 1,
                rewardType : 1,
                paymentMethod : 1,
                discount : 1,
                usage : 1,
                startTime : 1,
                endTime : 1,
                globalUsageLimit : 1,
                perUserLimit : 1,
                globalClaimCount : 1,
                unlockedCodes : 1,
                qualifyingTrips : 1,
                vehicleType : 1,
                tripCount : 1,
                created: 1,
                howITWorks: 1,
                description: 1,
                termsConditions: 1,
                users:1
            }
        } 
        // {
        //     $match: {
        //         ab: {
        //             $eq: true
        //         }
        //     }
        // }
        ],

        (err, result) => { 
            return callback(err, result); });
}


module.exports = {
   validateCampaign
}