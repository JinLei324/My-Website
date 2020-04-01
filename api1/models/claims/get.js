// Post a new offer

require("moment");
const Joi = require("joi");
const async = require("async");
const logger = require('winston');
const Promise = require('promise');
const ObjectID = require('mongodb').ObjectID;
const claims = require('../../../models/promoCampaigns/claims');
const error = require('../../../statusMessages/responseMessage');




/*
Get qualified trips count
 */
var getUnlockedCodeCountByCampaignIdValidator = {
    params: {
        campaignId: Joi.string().required().description('Mandatory Field. Used to get the promo campaign details')
    }
}

/*
@Get claimed data by promo id
 */
var getClaimedDataByCampaignIdValidator = {
    params: {
        campaignId: Joi.string().required().description("Mandatory field. Used to gget the unlocked datas")
    }
}

var getUnlockedCodeCountByCampaignIdHandler = (request, reply) => {
    var campaignId = request.params.campaignId;
    claims.getUnlockedCount(campaignId, (err, response) => {
        if (err) {
            logger.error('No response: ' + JSON.stringify(err));
            return reply({
                message: "Error while getting campaigns",
                count: 0
            }).code(500);
        } else {
            return reply({
                message: "success",
                count: response
            }).code(200);
        }
    });
}

var getClaimedDataByCampaignIdHandler = (request, reply) => {
    var campaignId = request.params.campaignId;
    claims.getUnlockedData(campaignId, (err, response) => {
        if (err) {
            logger.error('No response: ' + JSON.stringify(err));
            return reply({
                message: "Error while getting claimed data",
                data: []
            }).code(500);
        } else {
            return reply({
                message: "success",
                data: response
            }).code(200);
        }
    });
}



var allClaims = (request, reply) => {
    claims.getAllClaims({}, (err, claims) => {
        if (err) {
            logger.error('No response: ' + JSON.stringify(err));
            return reply({
                message: "Error while getting claims"
            }).code(500);
        }
        /*
        1. Booking Id
        2. Claim Id
        3. Claim Status
        4. Order Total
        5. Discount Type - Wallet, Credit, Coupon Delivery, Order Discount
        6. Discount Value
        7. Final Value
        8. Coupon Code
         */
        var claimsData = [];
        async.forEach(claims, (item, callbackloop) => {
            claimsData.push({
                'id': item._id.toString(),
                'userId': item.userId,
                'code': item.code,
                'startDate': item.startTime,
                'endDate': item.endTime,
                'status': item.status,
                'globalUsageLimit': item.globalUsageLimit,
                'totalClaims': item.globalClaimCount,
                'lockedTimeStamp': item.lockedTimeStamp.toString(),
                'unlockTimeStamp': item.unlockedTimeStamp.toString(),
                'claimTimeStamp': item.claimTimeStamp.toString()

            });
            return callbackloop(null);
        }, (loopErr) => {
            return reply({
                message: "success",
                data: claimsData
            }).code(200);
        });
    });
}



let response = {
    status: {
        200: {
            message: "success"
        },
        500: {
            message: "Error while getting details"
        }
    }
}

// export handler and validator
module.exports = {
    getUnlockedCodeCountByCampaignIdHandler,
    getUnlockedCodeCountByCampaignIdValidator,
    getClaimedDataByCampaignIdHandler,
    getClaimedDataByCampaignIdValidator


}