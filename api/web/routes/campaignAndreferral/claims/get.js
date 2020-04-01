// Post a new offer

require("moment");
const Joi = require("joi");
const async = require("async");
const logger = require('winston');
const Promise = require('promise');
const ObjectID = require('mongodb').ObjectID;

const claims = require('../../../../models/claims');





/*
Get qualified trips count
 */
// var getUnlockedCodeCountByCampaignIdValidator = {
//     params: {
//         campaignId: Joi.string().required().description('Mandatory Field. Used to get the promo campaign details')
//     }
// }

// /*
// @Get claimed data by promo id
//  */
var getClaimedDataByCampaignIdValidator = {
    params: {
        campaignId: Joi.string().required().description("Mandatory field. Used to gget the unlocked datas")
    }
}

// var getUnlockedCodeCountByCampaignIdHandler = (request, reply) => {
//     var campaignId = request.params.campaignId;
//     claims.getUnlockedCount(campaignId, (err, response) => {
//         if (err) {
//             logger.error('No response: ' + JSON.stringify(err));
//             return reply({
//                 message: "Error while getting campaigns",
//                 count: 0
//             }).code(500);
//         } else {
//             return reply({
//                 message: "success",
//                 count: response
//             }).code(200);
//         }
//     });
// }

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
    claims.allClaims({}, (err, claims) => {
        if (err) {
            logger.error('No response: ' + JSON.stringify(err));
            return reply({
                message: "Error while getting claims"
            }).code(500);
        }

        var claimsData = [];
        async.forEach(claims, (item, callbackloop) => {
            claimsData.push({
                "id": item._id.toString(),
                "userName": item.userName,
                "userId": item.userId,
                "cartId": item.cartId,
                "claimStatus": item.status,
                "currency": item.currency,
                "currencySymbol": item.currencySymbol,
                "deliveryFee": item.deliveryFee,
                "cartValue": item.cartValue,
                "discountType": item.discount ? item.discount.typeName : 0,
                "discountValue": item.discount ? item.discount.value : 0,
                "finalValue": item.discountValue,
                "couponCode": item.couponCode,
                'lockedTimeStamp': item.lockedTimeStamp,
                'unlockTimeStamp': item.unlockedTimeStamp,
                'claimTimeStamp': item.claimTimeStamp
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
    // getUnlockedCodeCountByCampaignIdHandler,
    // getUnlockedCodeCountByCampaignIdValidator,
    getClaimedDataByCampaignIdHandler,
    getClaimedDataByCampaignIdValidator,
    allClaims


}